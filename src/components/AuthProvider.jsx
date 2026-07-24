// 카카오 로그인 — Supabase Auth (익명 세션 기반, linkIdentity로 데이터 보존)
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, ensureSession, KAKAO_OPTS } from '../lib/supabase'

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

  useEffect(() => {
    if (!supabase) return
    // 첫 방문 익명 세션 — 비차단
    ensureSession()

    // 항상 getUser()로 최신 유저(identities 포함)를 읽음
    const refresh = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        setUser(data.user ?? null)
      } catch {
        setUser(null)
      }
    }
    refresh()
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh())
    return () => sub.subscription.unsubscribe()
  }, [])

  // ⚠ linkIdentity 직후 is_anonymous 플래그가 바로 안 바뀌므로
  //   "카카오 identity가 연동됐는지"로 로그인 여부를 판정한다.
  const isLoggedIn = !!user && (user.is_anonymous === false || !!kakaoIdentity(user))

  // signInWithOAuth: 첫 로그인이면 카카오 계정 생성, 재방문이면 그 계정으로 로그인.
  // (메모 작성이 로그인 뒤에만 되므로 익명 데이터 보존용 linkIdentity가 불필요하고,
  //  linkIdentity는 재방문 시 "이미 연동됨" 오류로 로그인 루프를 만든다.)
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
