// 폭발음 — Web Audio API로 합성 (별도 음원 파일 없음)
//  · GainNode로 볼륨 조절 (기본 배율 0.15)
//  · highpass 100Hz로 초저음 럼블만 살짝 컷 (저음은 살림)
//  · 깊고 긴 "펑…" — 공명 바디 + 저음 붐 + 감쇠 꼬리 (~0.85초)

const VOL_KEY = 'boomb-it.boomVolume'
export const DEFAULT_VOLUME = 0.15
const MAX_VOLUME = 0.4

const clampVol = (v) => Math.min(MAX_VOLUME, Math.max(0, Number(v)))

export function getBoomVolume() {
  const raw = parseFloat(localStorage.getItem(VOL_KEY))
  return Number.isFinite(raw) ? clampVol(raw) : DEFAULT_VOLUME
}

export function setBoomVolume(v) {
  localStorage.setItem(VOL_KEY, String(clampVol(v)))
}

let ctx
function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

// 사용자 첫 클릭에서 호출 — 브라우저 정책상 클릭 전에는 소리가 안 남
export function unlockAudio() {
  const c = ac()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
}

function noiseBuffer(c, dur, shape) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, shape)
  }
  return buf
}

// volume 인자를 주면 그 값으로, 없으면 localStorage 저장값으로 재생
export function playBoom(volume) {
  const c = ac()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})

  const vol = clampVol(volume ?? getBoomVolume())
  if (vol <= 0) return

  try {
    const now = c.currentTime
    const dur = 0.85 // 더 긴 "펑…" 여운

    // 마스터 볼륨
    const master = c.createGain()
    master.gain.setValueAtTime(vol, now)
    // 초저음(럼블)만 살짝 컷 — 저음은 살림
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.setValueAtTime(100, now)
    master.connect(hp).connect(c.destination)

    // ① 어택 '크랙' — 터지는 순간
    const crack = c.createBufferSource()
    crack.buffer = noiseBuffer(c, 0.04, 1)
    const cg = c.createGain()
    cg.gain.setValueAtTime(0.9, now)
    cg.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    crack.connect(cg).connect(master)

    // ② 본체 "펑" — 공명 로우패스(Q)를 아래로 스윕한 노이즈, 길게
    const src = c.createBufferSource()
    src.buffer = noiseBuffer(c, dur, 0.9)
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.Q.setValueAtTime(10, now) // 공명 → "펑" 울림
    lp.frequency.setValueAtTime(1100, now)
    lp.frequency.exponentialRampToValueAtTime(160, now + dur)
    const ng = c.createGain()
    ng.gain.setValueAtTime(0.85, now)
    ng.gain.exponentialRampToValueAtTime(0.001, now + dur)
    src.connect(lp).connect(ng).connect(master)

    // ③ 깊은 저음 '붐' — 낮게 떨어지는 사인
    const boom = c.createOscillator()
    boom.type = 'sine'
    boom.frequency.setValueAtTime(150, now)
    boom.frequency.exponentialRampToValueAtTime(46, now + 0.5)
    const bg = c.createGain()
    bg.gain.setValueAtTime(1, now)
    bg.gain.exponentialRampToValueAtTime(0.001, now + 0.75)
    boom.connect(bg).connect(master)

    // ④ 톤 바디 — 피치가 떨어지는 삼각파로 두께감
    const osc = c.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(360, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.5)
    const og = c.createGain()
    og.gain.setValueAtTime(0.5, now)
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
    osc.connect(og).connect(master)

    crack.start(now)
    crack.stop(now + 0.05)
    src.start(now)
    src.stop(now + dur)
    boom.start(now)
    boom.stop(now + 0.75)
    osc.start(now)
    osc.stop(now + 0.6)
  } catch {
    /* 오디오 실패는 조용히 무시 */
  }
}
