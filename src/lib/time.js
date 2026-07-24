// 시간·표정은 전부 계산 (기획서 4-6 / 지침서 5-1). 절대 누적하지 않음.

export function bombState(occ, task, now = Date.now()) {
  if (!task || task.mode === 'peace') return 'peace'
  const end = new Date(occ.scheduled_at).getTime()
  const start = new Date(occ.bomb_starts_at).getTime()
  if (now >= end) return 'exploded'
  if (end - now <= 5 * 60000) return 'urgent' // 폭발 5분 전부터 임박
  if (now >= start + (end - start) / 2) return 'half'
  return 'appear'
}

export function remainingMs(occ, now = Date.now()) {
  return new Date(occ.scheduled_at).getTime() - now
}

export function elapsedMs(occ, now = Date.now()) {
  return now - new Date(occ.scheduled_at).getTime()
}

// 0~1 진행률 (링 채움용)
export function progress(occ, task, now = Date.now()) {
  if (!task || task.mode === 'peace' || !occ.bomb_starts_at) return 0
  const end = new Date(occ.scheduled_at).getTime()
  const start = new Date(occ.bomb_starts_at).getTime()
  if (now <= start) return 0
  if (now >= end) return 1
  return (now - start) / (end - start)
}

// H:MM:SS (또는 M:SS) — 카운트다운 대형 숫자
export function formatClock(ms) {
  const t = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`
  return `${m}:${pad(s)}`
}

// "1시간 20분" 같은 사람이 읽는 표기
export function humanDur(ms) {
  const abs = Math.abs(ms)
  const t = Math.floor(abs / 1000)
  const d = Math.floor(t / 86400)
  const h = Math.floor((t % 86400) / 3600)
  const m = Math.floor((t % 3600) / 60)
  if (d > 0) return h > 0 ? `${d}일 ${h}시간` : `${d}일`
  if (h > 0) return m > 0 ? `${h}시간 ${m}분` : `${h}시간`
  if (m > 0) return `${m}분`
  return '1분 이내'
}

export function humanRemain(occ, now = Date.now()) {
  return `${humanDur(remainingMs(occ, now))} 남음`
}
export function humanElapsed(occ, now = Date.now()) {
  return `${humanDur(elapsedMs(occ, now))} 지남`
}

// 마감 시각 "17:00"
export function dueClock(occ) {
  const d = new Date(occ.scheduled_at)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 마감 날짜·시각 "7월 24일 17:00"
export function dueDateClock(occ) {
  const d = new Date(occ.scheduled_at)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function pad(n) {
  return String(n).padStart(2, '0')
}
