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
    'real_users',     (select count(*) from auth.users where is_anonymous = false),
    'new_users_7d',   (select count(*) from auth.users
                        where is_anonymous = false
                          and created_at >= now() - interval '7 days'),
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

-- 3) 사용자 명단 페이지네이션 — '더보기'가 호출할 때마다 다음 페이지를 반환.
--    p_anon=false: 가입 사용자 / true: 익명 사용자. 최근 가입순(created_at desc).
create or replace function public.admin_users(
  p_anon   boolean,
  p_offset int default 0,
  p_limit  int default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := '095d57ed-60e5-4d28-bb48-72183f0763a5';
  result  jsonb;
begin
  if auth.uid() is null or auth.uid() <> v_admin then
    raise exception 'not authorized';
  end if;

  select coalesce(jsonb_agg(us order by us.created_at desc), '[]'::jsonb)
  into result
  from (
    select
      u.id,
      u.created_at,
      u.email,
      u.last_sign_in_at,
      case when u.is_anonymous then 'anonymous'
           else coalesce(u.raw_app_meta_data->>'provider', 'email') end as provider,
      coalesce(
        u.raw_user_meta_data->>'nickname',
        u.raw_user_meta_data->>'name',
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'user_name',
        u.raw_user_meta_data->>'preferred_username'
      ) as nickname
    from auth.users u
    where u.is_anonymous = p_anon
    order by u.created_at desc
    offset greatest(p_offset, 0)
    limit least(greatest(p_limit, 1), 100)
  ) us;

  return result;
end;
$$;

grant execute on function public.admin_users(boolean, int, int) to authenticated;

-- 4) 깔때기용 사용자 이벤트 테이블 (사용자당 event 1회 — PK로 중복 방지)
create table if not exists public.user_event (
  user_id    uuid not null references auth.users(id) on delete cascade,
  event      text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, event)
);
alter table public.user_event enable row level security;
drop policy if exists own_event on public.user_event;
create policy own_event on public.user_event
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5) 전환 깔때기 — 단계별 '사람 수'(distinct user)를 가입/익명으로 나눠 반환.
--    1 방문 · 2 할일1개+ · 3 PiP실제열림 · 4 폭발도달(미루기·삭제없이) · 5 완료 · 6 두번째할일
create or replace function public.admin_funnel()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := '095d57ed-60e5-4d28-bb48-72183f0763a5';
  result  jsonb;
begin
  if auth.uid() is null or auth.uid() <> v_admin then
    raise exception 'not authorized';
  end if;

  with ta as (
    select user_id, count(*) as c from public.task group by user_id
  ),
  pip as (
    select distinct user_id from public.user_event where event = 'pip_open'
  ),
  boom as (
    select distinct o.user_id
    from public.occurrence o
    join public.task t on t.id = o.task_id
    where t.mode = 'bomb'
      and coalesce(o.postpone_count, 0) = 0            -- 미룬 적 없음
      and o.scheduled_at <= now()                      -- 예정시각 지남 = 폭발
      and (o.responded_at is null or o.responded_at >= o.scheduled_at)  -- 폭발 전 완료가 아님
  ),
  dn as (
    select distinct user_id from public.occurrence where status = 'done'
  ),
  pu as (
    select
      u.is_anonymous                as anon,
      (coalesce(ta.c, 0) >= 1)      as s2,
      (p.user_id is not null)       as s3,
      (b.user_id is not null)       as s4,
      (d.user_id is not null)       as s5,
      (coalesce(ta.c, 0) >= 2)      as s6
    from auth.users u
    left join ta   on ta.user_id = u.id
    left join pip  p on p.user_id = u.id
    left join boom b on b.user_id = u.id
    left join dn   d on d.user_id = u.id
  )
  select jsonb_build_object(
    'real', jsonb_build_object(
      'visited', count(*) filter (where not anon),
      'task',    count(*) filter (where not anon and s2),
      'pip',     count(*) filter (where not anon and s3),
      'boom',    count(*) filter (where not anon and s4),
      'done',    count(*) filter (where not anon and s5),
      'second',  count(*) filter (where not anon and s6)
    ),
    'anon', jsonb_build_object(
      'visited', count(*) filter (where anon),
      'task',    count(*) filter (where anon and s2),
      'pip',     count(*) filter (where anon and s3),
      'boom',    count(*) filter (where anon and s4),
      'done',    count(*) filter (where anon and s5),
      'second',  count(*) filter (where anon and s6)
    )
  ) into result
  from pu;

  return result;
end;
$$;

grant execute on function public.admin_funnel() to authenticated;

-- 6) 토스앱 익명 방문자 화면 도달 깔때기 ─────────────────────────────
--    'entered'(앱 진입 = platform_toss 기록자)를 분모로, 각 화면에 '도달한 사람 수'.
--    수집: 클라이언트 MobileApp/ScreenTracker 가 platform_toss + screen_* 를
--          사용자당 1회(user_event PK)로 기록. 배포 이후분부터 집계됨.
create or replace function public.admin_toss_screens()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := '095d57ed-60e5-4d28-bb48-72183f0763a5';
  result  jsonb;
begin
  if auth.uid() is null or auth.uid() <> v_admin then
    raise exception 'not authorized';
  end if;

  with toss as (   -- 토스앱 진입자(= 앱을 실제로 연 익명 방문자)
    select distinct user_id from public.user_event where event = 'platform_toss'
  ),
  ev as (          -- 진입자 중 각 화면에 도달한 distinct 인원
    select ue.event, count(distinct ue.user_id) as c
    from public.user_event ue
    join toss t on t.user_id = ue.user_id
    where ue.event like 'screen_%'
    group by ue.event
  )
  select jsonb_build_object(
    'entered',  (select count(*) from toss),
    'home',     coalesce((select c from ev where event = 'screen_home'), 0),
    'new',      coalesce((select c from ev where event = 'screen_new'), 0),
    'detail',   coalesce((select c from ev where event = 'screen_detail'), 0),
    'edit',     coalesce((select c from ev where event = 'screen_edit'), 0),
    'stats',    coalesce((select c from ev where event = 'screen_stats'), 0),
    'archive',  coalesce((select c from ev where event = 'screen_archive'), 0),
    'settings', coalesce((select c from ev where event = 'screen_settings'), 0)
  ) into result;

  return result;
end;
$$;

grant execute on function public.admin_toss_screens() to authenticated;
