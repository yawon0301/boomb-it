// 폭탄 캐릭터 — 하나의 SVG, state 값에 따라 색·표정·심지만 바뀜 (지침서 3-4)
// state: 'appear'(흰·평온) | 'half'(베이지·불꽃) | 'urgent'(핑크·놀람) | 'exploded'(연기·멍) | 'peace'(웃음)
// 부드러운 그라데이션 몸통 + 회색 표정 (외곽선 없음).
import { useId } from 'react'

const FEATURE = '#7c7c7c' // 눈·눈썹·입
const FUSE = '#6e6e6e' // 심지
const CAP = '#cccccc' // 심지 캡
const SPARK = '#e6392b' // 불꽃 별
const SPARK_CORE = '#ff8a3d' // 불꽃 속
const SMOKE = '#cfcfcf' // 연기
const SCRIBBLE = '#c7c7c7' // 볼 낙서

// 상태별 몸통 그라데이션 id 접미사
const GRAD = { appear: 'gw', half: 'gt', urgent: 'gp', exploded: 'gw', peace: 'gw' }

// 뾰족한 폭발 별 경로
function starPath(cx, cy, spikes, outer, inner) {
  let d = ''
  const step = Math.PI / spikes
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = i * step - Math.PI / 2
    d += (i === 0 ? 'M' : 'L') + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1)
  }
  return d + 'Z'
}

export default function Bomb({ state = 'appear', size = 120, vibrate = false }) {
  const uid = useId().replace(/:/g, '')
  const gid = (n) => `${n}-${uid}`
  const lit = state === 'half' || state === 'urgent'
  const near = state === 'urgent' // 불꽃이 몸통에 가까움
  const anim = vibrate ? 'bomb-vibrate' : state === 'urgent' ? 'bomb-shake' : undefined

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={anim}
      style={{ display: 'block' }}
    >
      <defs>
        <radialGradient id={gid('gw')} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="58%" stopColor="#f2f2f3" />
          <stop offset="100%" stopColor="#dcdcde" />
        </radialGradient>
        <radialGradient id={gid('gt')} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#fdf1e0" />
          <stop offset="55%" stopColor="#f0dbbe" />
          <stop offset="100%" stopColor="#e1c199" />
        </radialGradient>
        <radialGradient id={gid('gp')} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#f9cdc1" />
          <stop offset="55%" stopColor="#efa89a" />
          <stop offset="100%" stopColor="#e3877a" />
        </radialGradient>
        <filter id={gid('sh')} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* 심지 / 연기 */}
      {state === 'exploded' ? (
        <path
          d="M50 24 C45 18 55 15 50 9 C46 4 53 3 50 -2"
          stroke={SMOKE}
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
      ) : (
        <path
          d={near ? 'M50 23 C50 17 53 12 57 13' : 'M50 23 C50 15 53 10 59 10 C64 10 66 14 69 11'}
          stroke={FUSE}
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* 불꽃 (half·urgent) */}
      {lit &&
        (() => {
          const sx = near ? 58 : 70
          const sy = near ? 14 : 12
          const o = near ? 11 : 9
          return (
            <g>
              <path d={starPath(sx, sy, 9, o, o * 0.5)} fill={SPARK} />
              <path d={starPath(sx, sy, 9, o * 0.55, o * 0.28)} fill={SPARK_CORE} />
            </g>
          )
        })()}

      {/* 심지 캡 */}
      <rect x="43" y="23" width="14" height="11" rx="3" fill={CAP} />

      {/* 몸통 */}
      <circle
        cx="50"
        cy="60"
        r="28"
        fill={`url(#${gid(GRAD[state] || 'gw')})`}
        filter={`url(#${gid('sh')})`}
      />
      {/* 하이라이트 */}
      <ellipse cx="40" cy="49" rx="8" ry="5.5" fill="#ffffff" opacity="0.5" />

      {/* 볼 낙서 (exploded) */}
      {state === 'exploded' && (
        <g
          stroke={SCRIBBLE}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.85"
        >
          <path d="M31 61 c-3 1 -3 4 0 4 c3 0 3 -4 6 -3 c2 1 1 4 -1 4 c-2 0 -3 -2 -1 -3" />
          <path d="M63 61 c-3 1 -3 4 0 4 c3 0 3 -4 6 -3 c2 1 1 4 -1 4 c-2 0 -3 -2 -1 -3" />
        </g>
      )}

      {/* 표정 */}
      <Face state={state} />
    </svg>
  )
}

function Brows({ angry }) {
  return (
    <g stroke={FEATURE} strokeWidth="2.6" strokeLinecap="round">
      {angry ? (
        <>
          <path d="M39 51 L47 54" />
          <path d="M61 51 L53 54" />
        </>
      ) : (
        <>
          <path d="M39 50 L47 51.5" />
          <path d="M61 50 L53 51.5" />
        </>
      )}
    </g>
  )
}

function Eyes() {
  return (
    <>
      <ellipse cx="42" cy="60" rx="2.2" ry="2.8" fill={FEATURE} />
      <ellipse cx="58" cy="60" rx="2.2" ry="2.8" fill={FEATURE} />
    </>
  )
}

function Face({ state }) {
  if (state === 'peace') {
    // 방긋 — 웃는 눈(∩)과 입(∪)
    return (
      <g stroke={FEATURE} strokeWidth="2.6" strokeLinecap="round" fill="none">
        <path d="M39 58 Q43 54 47 58" />
        <path d="M53 58 Q57 54 61 58" />
        <path d="M43 68 Q50 75 57 68" />
      </g>
    )
  }

  if (state === 'exploded') {
    // 멍 — 반짝이는 눈 + 물결 입 (+ 볼 낙서는 위에서)
    return (
      <g>
        <circle cx="42" cy="60" r="2.9" fill={FEATURE} />
        <circle cx="58" cy="60" r="2.9" fill={FEATURE} />
        <circle cx="43.2" cy="58.9" r="0.9" fill="#ffffff" />
        <circle cx="59.2" cy="58.9" r="0.9" fill="#ffffff" />
        <path
          d="M45 71 q2.5 -3 5 0 t5 0"
          stroke={FEATURE}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    )
  }

  if (state === 'urgent') {
    // 놀람 — 찡그린 눈썹 + O자 입
    return (
      <g>
        <Brows angry />
        <Eyes />
        <ellipse cx="50" cy="71" rx="3.4" ry="4.6" fill={FEATURE} />
      </g>
    )
  }

  if (state === 'half') {
    // 걱정 — 찡그린 눈썹 + 물결 입
    return (
      <g>
        <Brows angry />
        <Eyes />
        <path
          d="M45 70 q2.5 -3 5 0 t5 0"
          stroke={FEATURE}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    )
  }

  // appear — 담담
  return (
    <g>
      <Brows />
      <Eyes />
      <path d="M45 69 h10" stroke={FEATURE} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path
        d="M48 72 h4"
        stroke={FEATURE}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />
    </g>
  )
}
