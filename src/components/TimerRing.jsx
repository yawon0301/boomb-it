// 얇은 원형 진행 링 + 안쪽 폭탄 (지침서 3-3)
import Bomb from './Bomb'

export default function TimerRing({ progress = 0, state = 'appear', size = 200, vibrate = false }) {
  // size에 비례 (size=200에서 원래 값: 링 160 · 선 5 · 폭탄 120)
  const stroke = Math.max(3, Math.round(size * 0.025))
  const ringD = size * 0.8 // 링 지름
  const bomb = Math.round(size * 0.6)
  const r = (ringD - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = c * Math.min(1, Math.max(0, progress))
  const center = size / 2

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--color-flame)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-[stroke-dasharray] duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <Bomb state={state} size={bomb} vibrate={vibrate} />
      </div>
    </div>
  )
}
