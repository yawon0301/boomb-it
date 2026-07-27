-- ============================================================
-- boomb-it 관리자 대시보드 지원 (SQL Editor에 붙여넣고 Run · 재실행 안전)
--   1) 미루기 횟수 서버 추적용 컬럼
--   2) 관리자 전용 집계 함수 admin_dashboard()
-- ------------------------------------------------------------
-- ⚠️ 아래 v_admin 의 '<YOUR-USER-UID>' 를 내 계정 User UID로 바꾸세요.
--    (Supabase 대시보드 → Authentication → Users → 내 계정 → User UID)
--    src/lib/admin.js 의 ADMIN_USER_ID 와 같은 값이어야 합니다.
-- ============================================================

-- 1) 미루기 횟수: occurrence 에 카운터 (미룰 때마다 +1)
alter table public.occurrence
  add column if not exists postpone_count int not null default 0;

-- 2) 관리자 대시보드 — security definer 로 RLS 우회하여 전체 집계.
--    호출자가 관리자 UID가 아니면 예외.
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := '095d57ed-60e5-4d28-bb48-72183f0763a5';   -- ← 내 User UID
  result  jsonb;
begin
  if auth.uid() is null or auth.uid() <> v_admin then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'total_users',    (select count(*) from auth.users),
    'new_users_7d',   (select count(*) from auth.users
                        where created_at >= now() - interval '7 days'),
    'total_tasks',    (select count(*) from public.task),
    'done_count',     (select count(*) from public.occurrence where status = 'done'),
    'released_count', (select count(*) from public.occurrence where status = 'released'),
    'postpone_count', (select coalesce(sum(postpone_count), 0) from public.occurrence),
    'recent_tasks',   (
      select coalesce(jsonb_agg(r order by r.created_at desc), '[]'::jsonb)
      from (
        select
          t.content,
          t.created_at,
          coalesce(lo.scheduled_at, (t.due_date + t.due_time)::timestamptz) as due_at,
          coalesce(lo.status::text, 'pending') as status
        from public.task t
        left join lateral (
          select o.scheduled_at, o.status
          from public.occurrence o
          where o.task_id = t.id
          order by o.scheduled_at desc
          limit 1
        ) lo on true
        order by t.created_at desc
        limit 20
      ) r
    )
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_dashboard() to authenticated;
