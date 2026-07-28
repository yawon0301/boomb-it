// 카카오 로그인 — Supabase Auth (익명 세션 기반, linkIdentity로 데이터 보존)
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

    // 항상 getUser()로 최신 유저(identities 포함)를 읽음
    const refresh = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setUser(data.user ?? null)
      } catch {
        setUser(null)
      } finally {
        setReady(true)
      }
    }
    refresh()
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh())
    return () => sub.subscription.unsubscribe()
  }, [])

  // ⚠ linkIdentity 직후 is_anonymous 플래그가 바로 안 바뀌므로
  //   "카카오 identity가 연동됐는지"로 로그인 여부를 판정한다.
  const isLoggedIn = !!user && (user.is_anonymous === false || !!kakaoIdentity(user))

  // 관리자 판별 — ADMIN_USER_ID 와 로그인 UID가 일치할 때만
  const isAdmin = !!user && !!ADMIN_USER_ID && user.id === ADMIN_USER_ID

  // 카카오 연결(선택) — 익명으로 쓰던 데이터를 보존하며 계정을 잇는다.
  //  · 익명 세션이면 linkIdentity 로 현재 익명 유저에 카카오를 연동(데이터 유지).
  //    (linkIdentity 는 일반 웹에서만 동작하므로 실패하면 일반 로그인으로 폴백)
  //  · 이미 그 카카오가 다른 계정에 연동돼 있으면("이미 연동됨") signInWithOAuth 로
  //    기존 카카오 계정에 로그인해 루프를 피한다.
  async function loginKakao() {
    if (!supabase) return
    if (user?.is_anonymous) {
      try {
        const { error } = await supabase.auth.linkIdentity(KAKAO_OPTS)
        if (!error) return // OAuth 리다이렉트로 이어짐
      } catch {
        /* 링크 미지원/실패 → 아래 일반 로그인으로 폴백 */
      }
    }
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
