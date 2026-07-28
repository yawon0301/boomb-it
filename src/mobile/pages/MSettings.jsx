// 모바일 설정 — "소리·폭발 테스트"만 유지 (볼륨 슬라이더 + 저음 필터 + 테스트 버튼).
// 카카오 로그인은 토스 안에서 동작하지 않으므로 노출하지 않음(익명 전용).
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Volume2, Bomb as BombIcon } from 'lucide-react'
import { addTestBomb } from '../../lib/store'
import { playBoom, unlockAudio, getBoomVolume, setBoomVolume } from '../../lib/sound'

export default function MSettings() {
  const nav = useNavigate()
  const [volume, setVolume] = useState(getBoomVolume())

  function changeVolume(v) {
    setVolume(v)
    setBoomVolume(v)
  }

  function testBomb() {
    unlockAudio()
    addTestBomb(10)
    nav('/') // 홈에서 10초 카운트다운 → 폭발음 확인
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center px-4">
        <h1 className="text-[20px] font-extrabold tracking-tight text-ink">설정</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <p className="mb-3 px-1 text-[13px] text-sub">익명으로 사용 중이에요.</p>

        <section className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <div className="mb-3 flex items-center gap-2 text-ink">
            <Volume2 size={18} />
            <h2 className="text-[15px] font-semibold">소리 · 폭발 테스트</h2>
          </div>
          <p className="mb-3 text-[13px] leading-relaxed text-sub">
            폭발음 크기를 조절하고 바로 들어봅니다. 저음을 깎아 옆자리로 덜 퍼집니다.
          </p>

          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="boomVol" className="text-[14px] font-medium text-ink">
              폭발음 크기
            </label>
            <span className="text-[14px] tabular-nums text-sub">{volume.toFixed(2)}</span>
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
                playBoom(volume)
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-[14px] font-medium text-ink transition active:bg-fill"
            >
              <Volume2 size={16} /> 소리 테스트
            </button>
          </div>

          <button
            onClick={testBomb}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.98]"
            style={{ background: 'var(--color-flame)' }}
          >
            <BombIcon size={17} /> 10초 뒤 폭탄 터뜨리기
          </button>
          <p className="mt-2 text-[12px] text-sub">
            소리가 안 들리면 크기 값·기기 볼륨·무음 모드를 확인하세요.
          </p>
        </section>
      </div>
    </>
  )
}
