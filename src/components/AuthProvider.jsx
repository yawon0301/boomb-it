// 카카오 로그인 — Supabase Auth (익명 세션 기반, linkIdentity로 데이터 보존)
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, ensureSession, KAKAO_OPTS } from '../lib/supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

// 카카오 닉네임 (선택 동의라 없을 수 있음 → "붐잇 사용자")
function pickNickname(user) {
  const m = user?.user_metadata ?? {}
  return (
    m.nickname ||
    m.name ||
    m.full_name ||
    m.user_name ||
    m.preferred_username ||
    '붐잇 사용자'
  )
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (!supabase) return
    // 첫 방문 익명 세션 — 비차단 (앱 렌더를 막지 않음)
    ensureSession()
    supabase.auth
      .getUser()
      .then(({ data }) => setUser(data.user ?? null))
      .catch(() => {})
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const isLoggedIn = !!user && user.is_anonymous === false

  // 익명이면 linkIdentity(데이터 보존), 아니면 signInWithOAuth
  async function loginKakao() {
    if (!supabase) return
    const { data } = await supabase.auth.getSession()
    const session = data.session
    if (session?.user?.is_anonymous) {
      await supabase.auth.linkIdentity(KAKAO_OPTS)
    } else {
      await supabase.auth.signInWithOAuth(KAKAO_OPTS)
    }
  }

  // 로그아웃 후 곧바로 다시 익명 세션 — 로그인 화면으로 막지 않음
  async function logout() {
    if (!supabase) return
    await supabase.auth.signOut()
    await supabase.auth.signInAnonymously()
  }

  return (
    <AuthCtx.Provider
      value={{
        isLoggedIn,
        nickname: pickNickname(user),
        loginKakao,
        logout,
        configured: !!supabase,
      }}
    >
      {children}
    </AuthCtx.Provider>
  )
}
