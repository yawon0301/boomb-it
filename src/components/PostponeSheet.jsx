// 미루기 시간 선택 (지침서 5-5) — 10분 단위 10분~3시간 + 날짜·시간 직접
import { useState } from 'react'

// 10분 단위, 10분 ~ 3시간 → 18개
const POSTPONE_OPTIONS = Array.from({ length: 18 }, (_, i) => (i + 1) * 10)

function label(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}분`
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}

export default function PostponeSheet({ onPick, onClose }) {
  const [custom, setCustom] = useState(false)
  const [dt, setDt] = useState('')

  function pickMinutes(min) {
    onPick(new Date(Date.now() + min * 60000))
  }
  function pickCustom() {
    if (!dt) return
    onPick(new Date(dt))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-[480px] rounded-t-3xl bg-white p-4 pb-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <h3 className="mb-3 text-center text-[15px] font-semibold text-ink">언제로 미룰까요?</h3>

        {!custom ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {POSTPONE_OPTIONS.map((min) => (
                <button
                  key={min}
                  onClick={() => pickMinutes(min)}
                  className="rounded-2xl bg-fill py-3 text-[14px] font-medium text-ink transition active:scale-95"
                >
                  {label(min)}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCustom(true)}
              className="mt-3 w-full rounded-2xl border border-line py-3 text-[14px] font-medium text-sub"
            >
              날짜·시간 직접 고르기
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="datetime-local"
              value={dt}
              onChange={(e) => setDt(e.target.value)}
              className="w-full rounded-2xl bg-fill px-4 py-3 text-[15px] text-ink outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setCustom(false)}
                className="flex-1 rounded-2xl bg-fill py-3 text-[14px] font-medium text-sub"
              >
                뒤로
              </button>
              <button
                onClick={pickCustom}
                disabled={!dt}
                className="flex-1 rounded-2xl py-3 text-[14px] font-medium text-white disabled:opacity-40"
                style={{ background: 'var(--color-flame)' }}
              >
                이때로 미루기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
