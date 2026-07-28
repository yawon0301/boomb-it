import { defineConfig } from '@apps-in-toss/web-framework/config'

// 앱인토스(WebView) 미니앱 설정.
// ⚠ appName / brand 는 앱인토스 개발자센터 콘솔에 "등록한 앱 정보"와 정확히 일치해야 합니다.
//   (appName 은 딥링크 intoss://{appName} 및 배포 식별자로 쓰입니다)
//
// 붐잇 웹 코드는 그대로 두고, Vite 빌드를 그대로 감싸서 토스 아티팩트를 만듭니다.
// build 명령에 VITE_TOSS=1 을 주입 → 앱 안에서 카카오 로그인 UI를 숨기고 익명 전용으로 동작.
export default defineConfig({
  appName: 'boomb-it', // TODO: 콘솔에 등록한 실제 appName 으로 교체
  brand: {
    displayName: '붐잇',
    primaryColor: '#ff9500', // 붐잇 --color-flame
    icon: '', // TODO: 콘솔에 등록한 아이콘 URL
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'VITE_TOSS=1 vite',
      build: 'VITE_TOSS=1 vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
})
