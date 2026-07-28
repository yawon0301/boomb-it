// 토스 웹뷰용 모바일 앱 — 데스크톱 App 과 별개의 라우팅/셸.
// (같은 Supabase 백엔드·store·폭탄 컴포넌트를 그대로 재사용)
import { useEffect, useRef } from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import { initStore, listPending } from '../lib/store'
import { remainingMs } from '../lib/time'
import { playBoom } from '../lib/sound'
import { useNow, useStore } from '../lib/hooks'
import MBottomNav from './components/MBottomNav'
import MHome from './pages/MHome'
import MStats from './pages/MStats'
import MNewTask from './pages/MNewTask'
import MEditTask from './pages/MEditTask'
import MTaskDetail from './pages/MTaskDetail'
import MSettings from './pages/MSettings'
import MArchive from './pages/MArchive'

// 앱 안에서 폭탄이 터지는 순간 작은 폭발음 (지침서 B-5의 in-app 부분만).
// ⚠ 브라우저 알림("10초 뒤 터집니다")은 토스 웹뷰에서 미지원이라 여기선 만들지 않음.
function ExplosionWatcher() {
  useStore()
  const now = useNow(1000)
  const exploded = useRef(new Set())
  const inited = useRef(false)

  for (const { occ, task } of listPending()) {
    if (task.mode !== 'bomb') continue
    const rem = remainingMs(occ, now)
    if (rem <= 0) {
      if (!exploded.current.has(occ.id)) {
        exploded.current.add(occ.id)
        if (inited.current) playBoom() // 첫 틱에 이미 터진 건 소리 없이 표시만
      }
    } else {
      exploded.current.delete(occ.id) // 미루면 다시 무장
    }
  }
  inited.current = true
  return null
}

function MobileShell() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[520px] flex-col overflow-hidden bg-white">
      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
      <MBottomNav />
    </div>
  )
}

export default function MobileApp() {
  useEffect(() => {
    initStore()
  }, [])

  return (
    <>
      <ExplosionWatcher />
      <Routes>
        <Route element={<MobileShell />}>
          <Route path="/" element={<MHome />} />
          <Route path="/stats" element={<MStats />} />
          <Route path="/archive" element={<MArchive />} />
          <Route path="/settings" element={<MSettings />} />
        </Route>
        <Route path="/new" element={<MNewTask />} />
        <Route path="/task/:id/edit" element={<MEditTask />} />
        <Route path="/task/:id" element={<MTaskDetail />} />
      </Routes>
    </>
  )
}
