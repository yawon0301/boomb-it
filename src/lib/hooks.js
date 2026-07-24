import { useEffect, useState, useSyncExternalStore } from 'react'
import { subscribe, getVersion } from './store'

// 스토어 변경 구독 (localStorage 데이터가 바뀌면 리렌더)
export function useStore() {
  return useSyncExternalStore(subscribe, getVersion)
}

// 1초마다 '지금'을 갱신 — 값을 누적하지 않고 매번 다시 계산 (지침서 5-1)
export function useNow(intervalMs = 1000) {
  return useNowIn(null, intervalMs)
}

// 지정한 window의 타이머로 갱신.
// PiP(떠 있는 창)는 항상 보이므로 그 창의 setInterval을 쓰면
// 메인 탭이 백그라운드로 스로틀돼도 매초 정확히 갱신된다.
export function useNowIn(win, intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const w = win || window
    const id = w.setInterval(() => setNow(Date.now()), intervalMs)
    return () => w.clearInterval(id)
  }, [win, intervalMs])
  return now
}
