// 폭탄 캐릭터 — 하나의 SVG, state 값에 따라 색·표정·심지만 바뀜 (지침서 3-4)
// state: 'appear' | 'half' | 'urgent' | 'exploded' | 'peace'

const BODY = {
  appear: 'var(--color-bomb-white)',
  half: 'var(--color-bomb-peach)',
  urgent: 'var(--color-bomb-red)',
  exploded: 'var(--color-bomb-white)',
  peace: 'var(--color-bomb-white)',
}

const INK = 'var(--color-ink)'
const FLAME = 'var(--color-flame)'

export default function Bomb({ state = 'appear', size = 120, vibrate = false }) {
  const lit = state === 'half' || state === 'urgent'
  const big = state === 'urgent'
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
      {/* 폭발 파편 (exploded 전용) */}
      {state === 'exploded' && (
        <g stroke={INK} strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="60" x2="4" y2="56" />
          <line x1="88" y1="60" x2="96" y2="56" />
          <line x1="20" y1="86" x2="14" y2="93" />
          <line x1="80" y1="86" x2="86" y2="93" />
          <line x1="50" y1="94" x2="50" y2="99" />
        </g>
      )}

      {/* 심지 캡 + 심지 */}
      <g stroke={INK} strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M45 28 L45 22 Q45 19 48 19 L54 19" strokeWidth="2.5" />
        <rect x="42" y="26" width="12" height="7" rx="2" fill={INK} stroke="none" />
      </g>

      {/* 심지 불꽃 */}
      {lit && (
        <g>
          <path
            d={
              big
                ? 'M54 19 C50 10 58 7 55 0 C64 6 66 16 60 20 C58 22 55 22 54 19 Z'
                : 'M54 19 C52 13 57 12 55 7 C61 11 61 17 58 19 C57 20 55 20 54 19 Z'
            }
            fill={FLAME}
          />
          <circle cx={big ? 57 : 56.5} cy={big ? 12 : 15} r={big ? 2.4 : 1.6} fill="#fff3c0" />
        </g>
      )}

      {/* 폭발 후 연기 */}
      {state === 'exploded' && (
        <path
          d="M54 18 C58 12 50 10 55 4 C60 8 56 12 60 10"
          stroke="var(--color-bomb-soot)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
      )}

      {/* 몸통 */}
      <circle cx="50" cy="60" r="30" fill={BODY[state]} stroke={INK} strokeWidth="2.5" />
      {/* 하이라이트 */}
      <ellipse cx="40" cy="50" rx="7" ry="5" fill="#ffffff" opacity="0.55" />

      {/* 그을음 (exploded) */}
      {state === 'exploded' && (
        <g stroke="var(--color-bomb-soot)" strokeWidth="2" strokeLinecap="round" opacity="0.85">
          <line x1="34" y1="72" x2="40" y2="72" />
          <line x1="60" y1="74" x2="66" y2="74" />
          <line x1="46" y1="80" x2="54" y2="80" />
        </g>
      )}

      {/* 표정 */}
      <Face state={state} />

      {/* 땀방울 */}
      {state === 'half' && <Drop x={72} y={52} />}
      {state === 'urgent' && (
        <>
          <Drop x={74} y={50} />
          <Drop x={26} y={52} />
        </>
      )}
    </svg>
  )
}

function Face({ state }) {
  const ink = INK
  if (state === 'peace') {
    // 방긋 웃는 눈(∩)과 입(∪)
    return (
      <g stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M39 56 Q43 52 47 56" />
        <path d="M53 56 Q57 52 61 56" />
        <path d="M43 66 Q50 73 57 66" />
      </g>
    )
  }
  if (state === 'exploded') {
    // 멍한 표정 — 나선 눈 + 물결 입
    return (
      <g stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M40 57 a3 3 0 1 0 3 -3" />
        <path d="M57 57 a3 3 0 1 0 3 -3" />
        <path d="M43 68 q3 -3 6 0 t6 0" />
      </g>
    )
  }
  if (state === 'urgent') {
    // 놀란 표정 — 눈 + O자 입
    return (
      <g fill={ink} stroke={ink}>
        <circle cx="41" cy="58" r="2.4" strokeWidth="0" />
        <circle cx="59" cy="58" r="2.4" strokeWidth="0" />
        <ellipse cx="50" cy="70" rx="4.5" ry="5.5" fill="#7a2f26" stroke={ink} strokeWidth="2" />
      </g>
    )
  }
  // appear / half — 담담한 표정
  return (
    <g stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill={ink}>
      <circle cx="41" cy="59" r="2.2" strokeWidth="0" />
      <circle cx="59" cy="59" r="2.2" strokeWidth="0" />
      <line x1="44" y1="69" x2="56" y2="69" />
    </g>
  )
}

function Drop({ x, y }) {
  return (
    <path
      d={`M${x} ${y} C${x - 3} ${y + 4} ${x - 3} ${y + 8} ${x} ${y + 8} C${x + 3} ${y + 8} ${x + 3} ${y + 4} ${x} ${y} Z`}
      fill="#7cc3f2"
      stroke={INK}
      strokeWidth="1.5"
    />
  )
}
