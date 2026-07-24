// /settings — 알림 권한, 떠 있는 창
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, PictureInPicture2, Check, X, Volume2, Bomb as BombIcon } from 'lucide-react'
import { askPermission, permissionState } from '../lib/notify'
import { setSettings, addTestBomb } from '../lib/store'
import { playBoom, unlockAudio, getBoomVolume, setBoomVolume } from '../lib/sound'
import { useFloat } from '../components/FloatProvider'
import Header from '../components/Header'

export default function Settings() {
  const float = useFloat()
  const nav = useNavigate()
  const [perm, setPerm] = useState(permissionState())
  const [volume, setVolume] = useState(getBoomVolume())

  function changeVolume(v) {
    setVolume(v)
    setBoomVolume(v) // localStorage 저장
  }

  function testBomb() {
    unlockAudio() // 이 클릭 제스처로 오디오 잠금 해제
    addTestBomb(10)
    nav('/') // 체크리스트에서 10초 카운트다운 → 폭발음 확인
  }

  async function requestPerm() {
    const p = await askPermission()
    setPerm(p)
    setSettings({ notifyAsked: true })
  }

  return (
    <>
      <Header title="설정" back />
      <div className="flex-1 overflow-y-auto px-4 py-5">
        {/* 떠 있게 하기 — 눈에 띄는 곳에 (지침서 5-4 / 6) */}
        <section className="mb-6 rounded-2xl bg-white p-4 ring-1 ring-line">
          <div className="mb-3 flex items-center gap-2 text-ink">
            <PictureInPicture2 size={18} />
            <h2 className="text-[15px] font-semibold">떠 있는 창</h2>
          </div>
          <p className="mb-3 text-[13px] leading-relaxed text-sub">
            폭탄을 다른 창 위에 항상 띄워둡니다. 브라우저 규칙상 버튼을 눌러야 열립니다.
          </p>
          <button
            onClick={float.floating ? float.close : float.open}
            className="w-full rounded-full py-3 text-[15px] font-semibold text-white transition active:scale-[0.98]"
            style={{ background: float.floating ? 'var(--color-sub)' : 'var(--color-flame)' }}
          >
            {float.floating ? '떠 있는 창 닫기' : '떠 있게 하기'}
          </button>
          {!float.supported && (
            <p className="mt-2 text-[12px] text-sub">
              이 브라우저는 지원하지 않습니다. Chrome/Edge를 권장합니다.
            </p>
          )}
          {float.error && <p className="mt-2 text-[12px] text-sub">{float.error}</p>}
        </section>

        {/* 알림 */}
        <section className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <div className="mb-3 flex items-center gap-2 text-ink">
            <Bell size={18} />
            <h2 className="text-[15px] font-semibold">알림</h2>
          </div>
          <p className="mb-3 text-[13px] leading-relaxed text-sub">
            폭발 10초 전에 “10초 뒤 터집니다” 알림을 1회 보냅니다.
          </p>
          <PermRow perm={perm} onRequest={requestPerm} />
        </section>

        {/* 테스트 */}
        <section className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-line">
          <div className="mb-3 flex items-center gap-2 text-ink">
            <Volume2 size={18} />
            <h2 className="text-[15px] font-semibold">소리 · 폭발 테스트</h2>
          </div>
          <p className="mb-3 text-[13px] leading-relaxed text-sub">
            폭발음 크기를 조절하고 바로 들어봅니다. 저음을 깎아 옆자리로 덜 퍼집니다.
          </p>

          {/* 폭발음 크기 슬라이더 */}
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="boomVol" className="text-[13px] font-medium text-ink">
              폭발음 크기
            </label>
            <span className="text-[13px] tabular-nums text-sub">{volume.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              id="boomVol"
              type="range"
              min="0"
              max="0.4"
              step="0.01"
              value={volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-fill accent-[var(--color-flame)]"
            />
            <button
              onClick={() => {
                unlockAudio()
                playBoom(volume) // 현재 값으로 바로 재생
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[14px] font-medium text-ink transition active:bg-fill"
            >
              <Volume2 size={16} /> 소리 테스트
            </button>
          </div>

          <button
            onClick={testBomb}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-[15px] font-semibold text-white transition active:scale-[0.98]"
            style={{ background: 'var(--color-flame)' }}
          >
            <BombIcon size={17} /> 10초 뒤 폭탄 터뜨리기
          </button>
          <p className="mt-2 text-[12px] text-sub">
            소리가 안 들리면 크기 값·기기 볼륨·브라우저 탭 음소거를 확인하세요.
          </p>
        </section>
      </div>
    </>
  )
}

function PermRow({ perm, onRequest }) {
  if (perm === 'granted')
    return (
      <div className="flex items-center gap-2 text-[14px]" style={{ color: '#1b7f3b' }}>
        <Check size={16} /> 알림이 켜져 있습니다
      </div>
    )
  if (perm === 'denied')
    return (
      <div className="flex items-center gap-2 text-[13px] text-sub">
        <X size={16} /> 거절됨 — 브라우저 주소창 자물쇠에서 직접 허용해야 합니다
      </div>
    )
  if (perm === 'unsupported')
    return <div className="text-[13px] text-sub">이 브라우저는 알림을 지원하지 않습니다.</div>
  return (
    <button
      onClick={onRequest}
      className="rounded-full border border-line px-4 py-2.5 text-[14px] font-medium text-ink transition active:bg-fill"
    >
      알림 허용하기
    </button>
  )
}
