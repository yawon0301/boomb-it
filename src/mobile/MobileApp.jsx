// 토스 웹뷰용 모바일 앱 — 데스크톱 App 과 별개의 라우팅/셸.
// (같은 Supabase 백엔드·store·폭탄 컴포넌트를 그대로 재사용)
import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom'
import { initStore, listPending, getSettings, setSettings, recordEvent } from '../lib/store'
import { remainingMs } from '../lib/time'
import { playBoom } from '../lib/sound'
import { useNow, useStore } from '../lib/hooks'
import MBottomNav from './components/MBottomNav'
import MobileTutorial from './components/MobileTutorial'
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

// 키보드가 올라올 때: 하단 탭은 숨기고, 입력칸만 키보드 위로(카톡처럼).
//  · iOS(키보드가 화면을 덮는 방식): VisualViewport로 겹침을 감지해 셸 높이를 보이는 영역에 맞춤
//  · Android(뷰포트가 줄어드는 방식): 100dvh가 이미 줄므로 입력칸이 자연히 키보드 위에 옴
//  · 입력 포커스(focusin)는 두 기기 공통 신호 → 이때 하단 탭 숨김
function MobileShell() {
  const [kbOpen, setKbOpen] = useState(false)
  const [overlayH, setOverlayH] = useState(null) // iOS 오버레이 키보드일 때 보이는 높이(px)

  useEffect(() => {
    const isTextInput = (el) =>
      el && el.matches?.('input:not([type]), input[type=text], input[type=search], textarea')
    const onFocusIn = (e) => isTextInput(e.target) && setKbOpen(true)
    const onFocusOut = () => setKbOpen(false)
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)

    const vv = window.visualViewport
    const onResize = () => {
      if (!vv) return
      const overlap = window.innerHeight - vv.height - vv.offsetTop
      setOverlayH(overlap > 120 ? vv.height : null) // 120px 초과 겹침이면 오버레이 키보드로 판단
    }
    vv?.addEventListener('resize', onResize)
    vv?.addEventListener('scroll', onResize)
    onResize()

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      vv?.removeEventListener('resize', onResize)
      vv?.removeEventListener('scroll', onResize)
    }
  }, [])

  const open = kbOpen || overlayH != null
  return (
    <div
      className="mx-auto flex w-full max-w-[520px] flex-col overflow-hidden bg-white"
      style={{ height: overlayH != null ? `${overlayH}px` : '100dvh' }}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
      {!open && <MBottomNav />}
    </div>
  )
}

// 토스앱 익명 방문자의 "화면 도달"을 기록 — 관리자 화면 도달 깔때기용.
//  · MobileApp 은 토스 빌드(isTossEnv)에서만 렌더되므로, 여기 온 사용자 = 토스앱 사용자.
//  · 앱 진입 1회(platform_toss) + 도달한 화면(screen_*)을 "사용자당 1회" 기록.
//    (user_event PK (user_id,event) 로 서버에서도 중복 무시. sent 로 세션 내 재호출도 차단)
function screenEvent(pathname) {
  if (pathname === '/') return 'screen_home'
  if (pathname === '/new') return 'screen_new'
  if (pathname === '/stats') return 'screen_stats'
  if (pathname === '/archive') return 'screen_archive'
  if (pathname === '/settings') return 'screen_settings'
  if (/^\/task\/[^/]+\/edit$/.test(pathname)) return 'screen_edit'
  if (/^\/task\//.test(pathname)) return 'screen_detail'
  return null
}

function ScreenTracker() {
  const loc = useLocation()
  const sent = useRef(new Set())
  useEffect(() => {
    if (sent.current.has('platform_toss')) return
    sent.current.add('platform_toss')
    recordEvent('platform_toss')
  }, [])
  useEffect(() => {
    const ev = screenEvent(loc.pathname)
    if (!ev || sent.current.has(ev)) return
    sent.current.add(ev)
    recordEvent(ev)
  }, [loc.pathname])
  return null
}

export default function MobileApp() {
  // 첫 사용자만 튜토리얼(설정에 tutorialSeen 없을 때). 두 번째부터는 바로 홈.
  const [showTutorial, setShowTutorial] = useState(() => !getSettings().tutorialSeen)

  useEffect(() => {
    initStore()
  }, [])

  function finishTutorial() {
    setSettings({ tutorialSeen: true })
    setShowTutorial(false)
  }

  return (
    <>
      <ExplosionWatcher />
      <ScreenTracker />
      {showTutorial && <MobileTutorial onDone={finishTutorial} />}
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
        {/* 매칭 안 되는 경로(예: /admin)는 흰 화면 대신 메인으로 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
