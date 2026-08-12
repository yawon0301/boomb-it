// 카카오 로그인 — Supabase Auth (익명 세션 기반, signInWithOAuth로 카카오 계정 로그인)
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, ensureSession, KAKAO_OPTS } from '../lib/supabase'
import { ADMIN_USER_ID } from '../lib/admin'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

function kakaoIdentity(user) {
  return (user?.identities ?? []).find((i) => i.provider === 'kakao')
}

// 카카오 닉네임 (선택 동의라 없을 수 있음 → "붐잇 사용자")
function pickNickname(user) {
  const m = user?.user_metadata ?? {}
  const k = kakaoIdentity(user)?.identity_data ?? {}
  return (
    m.nickname ||
    m.name ||
    m.full_name ||
    m.user_name ||
    m.preferred_username ||
    k.nickname ||
    k.name ||
    '붐잇 사용자'
  )
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false) // 최초 인증 판정 완료 여부 (가드용)

  useEffect(() => {
    if (!supabase) {
      setReady(true)
      return
    }
    // 첫 방문 익명 세션 — 비차단
    ensureSession()

    // 최초 인증 판정(가드 해제)은 초기 세션으로 1회만. getSession 은 콜백 "밖"이라 안전.
    supabase.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user ?? null))
      .finally(() => setReady(true))

    // ⚠ onAuthStateChange 콜백 "안"에서 getUser()/getSession() 등 await 호출 금지.
    //   supabase-js 가 auth 락(navigator.locks)을 콜백이 쥔 채 다시 대기 → 데드락.
    //   그러면 refresh 의 setReady(true) 가 영영 안 돌아 재방문 카카오(관리자) 세션에서
    //   ready 가 false 로 굳고 /admin(=!ready 면 null) 이 흰 화면이 된다.
    //   → 콜백이 넘겨주는 session.user 를 그대로 사용(identities 포함).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // ⚠ linkIdentity 직후 is_anonymous 플래그가 바로 안 바뀌므로
  //   "카카오 identity가 연동됐는지"로 로그인 여부를 판정한다.
  const isLoggedIn = !!user && (user.is_anonymous === false || !!kakaoIdentity(user))

  // 관리자 판별 — ADMIN_USER_ID 와 로그인 UID가 일치할 때만
  const isAdmin = !!user && !!ADMIN_USER_ID && user.id === ADMIN_USER_ID

  // 카카오 로그인 — signInWithOAuth 로 카카오 계정에 로그인.
  //  ⚠ linkIdentity(익명→카카오 연동)는 이미 카카오가 연동된 "재방문 사용자"에게
  //    OAuth 리다이렉트 이후 "이미 연동됨" 오류를 내며 로그인이 깨진다(함수 error로 안 잡힘).
  //    그래서 안정적인 signInWithOAuth 로 기존 카카오 계정에 바로 로그인한다.
  async function loginKakao() {
    if (!supabase) return
    await supabase.auth.signInWithOAuth(KAKAO_OPTS)
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
        isAdmin,
        ready,
        userId: user?.id ?? null,
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
