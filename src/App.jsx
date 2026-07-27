import { useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom'
import { initStore, listPending } from './lib/store'
import { remainingMs } from './lib/time'
import { boomSoon } from './lib/notify'
import { playBoom } from './lib/sound'
import { useNow, useStore } from './lib/hooks'
import FloatProvider from './components/FloatProvider'
import FloatContent from './components/FloatContent'
import Shell from './components/Shell'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Checklist from './pages/Checklist'
import NewTask from './pages/NewTask'
import TaskDetail from './pages/TaskDetail'
import Settings from './pages/Settings'
import Archive from './pages/Archive'
import Admin from './pages/Admin'

// 폭발 10초 전 알림 감시 (지침서 5-3 · B-5) — 항목당 1회
function NotifyWatcher() {
  useStore()
  const now = useNow(1000)
  const fired = useRef(new Set()) // 10초 전 알림 발송 여부
  const exploded = useRef(new Set()) // 폭발음 재생 여부
  const inited = useRef(false) // 첫 틱: 기존에 이미 터진 건 소리 없이 표시만
  const pending = listPending()

  for (const { occ, task } of pending) {
    if (task.mode !== 'bomb') continue
    const rem = remainingMs(occ, now)

    // 폭발 10초 전 알림 (지침서 B-5)
    if (rem > 0 && rem <= 10000 && !fired.current.has(occ.id)) {
      fired.current.add(occ.id)
      boomSoon(task.content)
    }
    if (rem > 11000) fired.current.delete(occ.id) // 미루면 다시 감시

    // 폭발 순간 작은 폭발음 — 앱이 열려 있는 동안 넘어갈 때만 1회
    if (rem <= 0) {
      if (!exploded.current.has(occ.id)) {
        exploded.current.add(occ.id)
        if (inited.current) playBoom()
      }
    } else {
      exploded.current.delete(occ.id) // 미루면 다시 무장
    }
  }

  inited.current = true
  return null
}

export default function App() {
  // 앱 진입 시 Supabase 데이터 로드 + 반복 발생 생성 (기획서 5-4)
  useEffect(() => {
    initStore()
  }, [])

  return (
    <FloatProvider>
      <NotifyWatcher />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Shell />}>
          <Route path="/app" element={<Checklist />} />
          <Route path="/new" element={<NewTask />} />
          <Route path="/task/:id" element={<TaskDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
        <Route
          path="/float"
          element={
            <div className="grid min-h-dvh place-items-center bg-[#ececed]">
              <div className="h-[300px] w-[460px] max-w-full overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-line/50">
                <FloatContent />
              </div>
            </div>
          }
        />
      </Routes>
    </FloatProvider>
  )
}
