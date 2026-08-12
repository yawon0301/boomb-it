// 관리자 판별 + 관리자 대시보드 데이터
import { supabase } from './supabase'

//
// ADMIN_USER_ID: 관리자 계정의 Supabase User UID.
//  · 확인: Supabase 대시보드 → Authentication → Users → 내 계정 행 클릭 → "User UID" 복사
//  · 같은 값을 supabase_admin.sql 의 v_admin 에도 넣으세요(데이터 접근 제어).
//  · 비워두면 아무도 관리자로 인식되지 않아 /admin 은 메인으로 리다이렉트됩니다.
export const ADMIN_USER_ID = '095d57ed-60e5-4d28-bb48-72183f0763a5'

// 통계 + 상태별 집계 + 최근 20개 (RLS 우회 함수, 관리자만 허용)
export async function fetchAdminDashboard() {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
  const { data, error } = await supabase.rpc('admin_dashboard')
  if (error) throw error
  return data
}

// 전환 깔때기 — 단계별 사람 수(가입/익명)
export async function fetchAdminFunnel() {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
  const { data, error } = await supabase.rpc('admin_funnel')
  if (error) throw error
  return data
}

// 토스앱 익명 방문자 화면 도달 깔때기 — 화면별 '도달한 사람 수'(RLS 우회, 관리자만)
export async function fetchAdminTossScreens() {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
  const { data, error } = await supabase.rpc('admin_toss_screens')
  if (error) throw error
  return data
}

// 사용자 명단 페이지네이션 — '더보기'가 누를 때마다 다음 페이지를 서버에서 가져옴.
// anon=false: 가입 사용자 / true: 익명 사용자. 최근 가입순.
export async function fetchAdminUsers(anon, offset = 0, limit = 10) {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
  const { data, error } = await supabase.rpc('admin_users', {
    p_anon: anon,
    p_offset: offset,
    p_limit: limit,
  })
  if (error) throw error
  return data ?? []
}
