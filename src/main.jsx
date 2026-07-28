import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import MobileApp from './mobile/MobileApp.jsx'
import AuthProvider from './components/AuthProvider.jsx'
import { isTossEnv } from './lib/platform'
import './index.css'

// 토스 웹뷰(--mode toss 빌드)에서는 모바일 전용 앱, 그 외 일반 웹은 기존 데스크톱 앱.
const Root = isTossEnv() ? MobileApp : App

// 토스 웹뷰에서만: 입력칸 포커스 시 iOS 자동 확대(줌) 방지.
// (일반 웹 index.html의 viewport는 건드리지 않음 — 데스크톱 접근성 유지)
if (isTossEnv()) {
  const vp = document.querySelector('meta[name="viewport"]')
  if (vp) {
    vp.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1, user-scalable=no',
    )
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
