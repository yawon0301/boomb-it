// 관리자 판별 + 관리자 대시보드 데이터
import { supabase } from './supabase'

//
// ADMIN_USER_ID: 관리자 계정의 Supabase User UID.
//  · 확인: Supabase 대시보드 → Authentication → Users → 내 계정 행 클릭 → "User UID" 복사
//  · 같은 값을 supabase_admin.sql 의 v_admin 에도 넣으세요(데이터 접근 제어).
//  · 비워두면 아무도 관리자로 인식되지 않아 /admin 은 메인으로 리다이렉트됩니다.
export const ADMIN_USER_ID = ''

// 전체 통계 + 최근 20개를 한 번에 가져옴 (RLS 우회 함수, 관리자만 허용)
export async function fetchAdminDashboard() {
  if (!supabase) throw new Error('Supabase가 설정되지 않았습니다.')
  const { data, error } = await supabase.rpc('admin_dashboard')
  if (error) throw error
  return data
}
