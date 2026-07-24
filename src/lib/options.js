// 타이머 길이 선택지 — 10분 단위, 최소 20분 ~ 3시간 → 17개
export const TIMER_OPTIONS = Array.from({ length: 17 }, (_, i) => 20 + i * 10)

export function minutesLabel(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}분`
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`
}
