// 우측 날개(통계 배너)용 집계 — 순수 계산. 저장하지 않음.
import { getState, taskOf } from './store'
import { remainingMs } from './time'

export function computeStats(now = Date.now()) {
  const { occurrences } = getState()
  const weekAgo = now - 7 * 86400000

  let activeBombs = 0 // 타들어가는 중인 폭탄
  let neglected = 0 // 터진 채 방치
  let peace = 0 // 평화 모드 상주
  let doneToday = 0
  let doneWeek = 0
  let releasedWeek = 0
  let nextBombMs = Infinity // 가장 임박한 폭탄까지

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayMs = startOfToday.getTime()

  for (const o of occurrences) {
    const task = taskOf(o)
    if (!task) continue

    if (o.status === 'pending') {
      const rem = remainingMs(o, now)
      if (task.mode === 'peace') {
        peace++
      } else if (rem <= 0) {
        neglected++
      } else {
        activeBombs++
        if (rem < nextBombMs) nextBombMs = rem
      }
    } else if (o.responded_at) {
      const r = new Date(o.responded_at).getTime()
      if (o.status === 'done') {
        if (r >= todayMs) doneToday++
        if (r >= weekAgo) doneWeek++
      } else if (o.status === 'released' && r >= weekAgo) {
        releasedWeek++
      }
    }
  }

  const handled = doneWeek + releasedWeek
  const completionRate = handled === 0 ? null : Math.round((doneWeek / handled) * 100)

  return {
    activeBombs,
    neglected,
    peace,
    doneToday,
    doneWeek,
    releasedWeek,
    completionRate, // 이번 주 완료율 (%) 또는 null
    nextBombMs: nextBombMs === Infinity ? null : nextBombMs,
  }
}
