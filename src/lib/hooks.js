import { useEffect, useState, useSyncExternalStore } from 'react'
import { subscribe, getVersion } from './store'

// 스토어 변경 구독 (localStorage 데이터가 바뀌면 리렌더)
export function useStore() {
  return useSyncExternalStore(subscribe, getVersion)
}

// 1초마다 '지금'을 갱신 — 값을 누적하지 않고 매번 다시 계산 (지침서 5-1)
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
