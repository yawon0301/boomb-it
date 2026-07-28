// 실행 환경 판별 — 앱인토스(토스 웹뷰) 안인지, 일반 웹 주소인지.
//
// 토스용 번들은 `vite --mode toss` 로 빌드한다(build:toss / granite.config.ts).
//   → import.meta.env.MODE === 'toss'. Vite가 정적 치환하므로 데스크톱 번들에서는
//   조건이 false 상수가 되어 모바일 코드가 트리셰이킹으로 빠진다(번들 분리 유지).
//   (env 변수 프리픽스 방식은 `ait build`의 npx 실행과 맞지 않아 mode 로 판별)
//
// 토스 앱 안(WebView)에서는 카카오 OAuth 리다이렉트가 동작하지 않으므로,
// 이 플래그로 카카오 로그인 UI를 숨기고 익명 사용만 노출한다.
export function isTossEnv() {
  return import.meta.env.MODE === 'toss'
}
