// 얇은 원형 진행 링 + 안쪽 폭탄 (지침서 3-3)
import Bomb from './Bomb'

export default function TimerRing({ progress = 0, state = 'appear', size = 200, vibrate = false }) {
  const stroke = 5
  const ringD = 160 // 링 지름
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
        <Bomb state={state} size={120} vibrate={vibrate} />
      </div>
    </div>
  )
}
