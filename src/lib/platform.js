// 실행 환경 판별 — 앱인토스(토스 웹뷰) 안인지, 일반 웹 주소인지.
//
// 토스용 번들은 빌드할 때 VITE_TOSS=1 로 주입한다(package.json 의 build:toss).
// 일반 웹(GitHub Pages) 빌드에는 이 값이 없으므로 항상 false → 기존 동작 그대로.
//
// 토스 앱 안(WebView)에서는 카카오 OAuth 리다이렉트가 동작하지 않으므로,
// 이 플래그로 카카오 로그인 UI를 숨기고 익명 사용만 노출한다.
export function isTossEnv() {
  return import.meta.env.VITE_TOSS === '1'
}
