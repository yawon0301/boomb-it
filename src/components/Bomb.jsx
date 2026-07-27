// 폭탄 캐릭터 — 사용자가 그린 원본 SVG(design/boomb-*.svg)를 그대로 렌더.
// state: 'appear' | 'half' | 'urgent' | 'exploded' | 'peace'
//  · 흰 배경만 제거하고 몸통 기준 viewBox로 정렬 (상태 전환 시 몸통 고정)
//  · size로 크기 조절, urgent/vibrate는 바깥 애니메이션 클래스로 처리
//  · 내부 filter/gradient id는 인스턴스마다 격리 (여러 개 동시 렌더 안전)
import { useId } from 'react'
import { BOMB_ART } from './bombArt'

// id="X" 와 그 참조 url(#X)/href="#X" 를 인스턴스별로 고유화
function nsIds(svg, uid) {
  const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1])
  let out = svg
  for (const id of ids) {
    out = out.split(`id="${id}"`).join(`id="${id}-${uid}"`)
    out = out.split(`url(#${id})`).join(`url(#${id}-${uid})`)
    out = out.split(`href="#${id}"`).join(`href="#${id}-${uid}"`)
  }
  return out
}

export default function Bomb({ state = 'appear', size = 120, vibrate = false }) {
  const uid = useId().replace(/:/g, '')
  const art = BOMB_ART[state === 'peace' ? 'appear' : state] || BOMB_ART.appear
  const anim = vibrate ? 'bomb-vibrate' : state === 'urgent' ? 'bomb-shake' : undefined

  return (
    <svg
      width={size}
      height={size}
      viewBox={art.viewBox}
      fill="none"
      aria-hidden="true"
      className={anim}
      style={{ display: 'block' }}
      dangerouslySetInnerHTML={{ __html: nsIds(art.inner, uid) }}
    />
  )
}
