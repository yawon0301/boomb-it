import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import MobileApp from './mobile/MobileApp.jsx'
import AuthProvider from './components/AuthProvider.jsx'
import { isTossEnv } from './lib/platform'
import './index.css'

// 토스 웹뷰(VITE_TOSS=1 빌드)에서는 모바일 전용 앱, 그 외 일반 웹은 기존 데스크톱 앱.
const Root = isTossEnv() ? MobileApp : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
