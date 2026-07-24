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

// 첫 방문: 세션 없으면 익명으로. (첫 방문 즉시 사용 동작은 유지)
export async function ensureSession() {
  if (!supabase) return
  try {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      await supabase.auth.signInAnonymously()
    }
  } catch {
    /* 네트워크/설정 문제로 실패해도 앱은 계속 동작 */
  }
}
