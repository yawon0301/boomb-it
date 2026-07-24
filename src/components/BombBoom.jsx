// 페이지 전환 폭발 연출 — 폭탄이 나타나 부르르 떨다가 "펑" 터진 뒤 onDone 호출
// phase: 'arm'(등장·진동) → 'boom'(섬광·파편·폭발음) → onDone
import { useEffect, useRef, useState } from 'react'
import Bomb from './Bomb'
import { playBoom } from '../lib/sound'

// 파편이 뻗어나갈 12방향(도)
const SPARKS = Array.from({ length: 12 }, (_, i) => i * 30)

export default function BombBoom({ onDone }) {
  const [phase, setPhase] = useState('arm')
  const done = useRef(false)

  useEffect(() => {
    // reduced-motion이어도 폭발 자체(섬광·파편·소리)는 보여준다.
    // 접근성 차원의 '잔진동·화면 흔들림'만 CSS에서 끈다.
    const armMs = 620 // 폭탄이 떨리는 시간
    const boomMs = 560 // 폭발 여운

    const t1 = setTimeout(() => {
      setPhase('boom')
      playBoom() // 합성 폭발음 (지침서 사운드)
    }, armMs)

    const t2 = setTimeout(() => {
      if (done.current) return
      done.current = true
      onDone?.()
    }, armMs + boomMs)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onDone])

  const booming = phase === 'boom'

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center overflow-hidden bg-white/80 backdrop-blur-[2px] ${
        booming ? 'boom-screen-shake' : ''
      }`}
      style={{ background: booming ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.72)' }}
      aria-hidden="true"
    >
      <div className="relative grid place-items-center">
        {/* 하얀 섬광 */}
        {booming && (
          <span
            className="boom-flash absolute h-40 w-40 rounded-full"
            style={{
              background:
                'radial-gradient(circle, #fff6d6 0%, var(--color-flame) 45%, rgba(255,149,0,0) 72%)',
            }}
          />
        )}

        {/* 파편 링 */}
        {booming && (
          <svg
            className="boom-burst absolute"
            width="240"
            height="240"
            viewBox="0 0 240 240"
            fill="none"
          >
            {SPARKS.map((deg) => {
              const rad = (deg * Math.PI) / 180
              const x1 = 120 + Math.cos(rad) * 42
              const y1 = 120 + Math.sin(rad) * 42
              const x2 = 120 + Math.cos(rad) * 104
              const y2 = 120 + Math.sin(rad) * 104
              return (
                <line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="var(--color-flame)"
                  strokeWidth={deg % 60 === 0 ? 6 : 3.5}
                  strokeLinecap="round"
                />
              )
            })}
          </svg>
        )}

        {/* 폭탄 본체 */}
        <div className={booming ? 'boom-pop' : 'boom-in'}>
          <Bomb state="urgent" size={132} vibrate={!booming} />
        </div>
      </div>
    </div>
  )
}
