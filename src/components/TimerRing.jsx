// 얇은 원형 진행 링 + 안쪽 폭탄 (지침서 3-3)
// startAt~endAt이 주어지면 남은 시간에 맞춰 CSS로 실시간 채워짐(스로틀에도 부드러움).
// (없으면 progress 값으로 정적 표시)
import { memo } from 'react'
import Bomb from './Bomb'

function TimerRing({ startAt, endAt, progress = 0, state = 'appear', size = 200, vibrate = false }) {
  // size에 비례 (size=200에서 원래 값: 링 160 · 선 5 · 폭탄 120)
  const stroke = Math.max(3, Math.round(size * 0.025))
  const ringD = size * 0.8 // 링 지름
  const bomb = Math.round(size * 0.6)
  const r = (ringD - stroke) / 2
  const c = 2 * Math.PI * r
  const center = size / 2

  // 진행 링 스타일 — 실시간 애니메이션 우선, 없으면 정적
  let ringStyle
  if (endAt && startAt) {
    const dur = Math.max(0, endAt - startAt) // 심지가 타는 전체 시간
    const delay = startAt - Date.now() // 음수면 이미 진행 중(그만큼 앞으로 감김)
    ringStyle = {
      strokeDashoffset: c, // 시작=빈 링, 애니메이션이 0(꽉 참)까지 채움
      animation: `ringFill ${dur}ms linear ${delay}ms forwards`,
    }
  } else {
    ringStyle = { strokeDashoffset: c * (1 - Math.min(1, Math.max(0, progress))) }
  }

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
          strokeDasharray={c}
          style={ringStyle}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <Bomb state={state} size={bomb} vibrate={vibrate} />
      </div>
    </div>
  )
}

// 매초 부모 리렌더로 애니메이션이 끊기지 않도록 — 실제 바뀌는 값만 비교
export default memo(TimerRing)
