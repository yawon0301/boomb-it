import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

// 값이 없으면 null — Supabase 미설정이어도 앱(localStorage)은 그대로 동작
export const supabase = url && anon ? createClient(url, anon) : null

// 카카오 OAuth 공통 옵션 (Redirect URL은 Supabase에 등록된 값)
export const KAKAO_OPTS = {
  provider: 'kakao',
  options: { redirectTo: 'https://yawon0301.github.io/boomb-it/' },
}

// 첫 방문: 세션 없으면 익명으로. (로그인 없이 바로 사용)
// AuthProvider·store 등 여러 곳에서 호출해도 익명 계정이 중복 생성되지 않도록
// 프라미스를 메모이즈해 실제 sign-in은 한 번만 수행한다. 현재 유저를 반환.
let sessionPromise = null
export async function ensureSession() {
  if (!supabase) return null
  if (!sessionPromise) {
    sessionPromise = (async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (data.session) return data.session.user ?? null
        const { data: created } = await supabase.auth.signInAnonymously()
        return created?.user ?? null
      } catch {
        return null /* 네트워크/설정 문제로 실패해도 앱은 계속 동작 */
      }
    })()
  }
  return sessionPromise
}
