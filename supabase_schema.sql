-- ============================================================
-- boomb-it Supabase 스키마 (한 번에 실행 / 재실행 안전)
-- Supabase → SQL Editor → 전체 붙여넣기 → Run
-- 기존 것을 지우고 새로 만들므로 여러 번 돌려도 됩니다.
-- (아직 실제 데이터가 없을 때 실행하세요)
-- ============================================================

drop table if exists public.occurrence cascade;
drop table if exists public.task cascade;
drop type  if exists occurrence_state;
drop type  if exists repeat_rule_t;
drop type  if exists task_mode;

create type task_mode        as enum ('bomb', 'peace');
create type repeat_rule_t    as enum ('none', 'daily');
create type occurrence_state as enum ('pending', 'done', 'released');

create table public.task (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  content       text not null check (char_length(content) between 1 and 500),
  due_time      time not null,
  due_date      date,
  repeat_rule   repeat_rule_t not null default 'none',
  mode          task_mode     not null default 'bomb',
  timer_minutes int check (
                  timer_minutes is null
                  or (timer_minutes between 20 and 180 and timer_minutes % 10 = 0)
                ),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.occurrence (
  id             bigint generated always as identity primary key,
  task_id        bigint not null references public.task(id) on delete cascade,
  user_id        uuid   not null references auth.users(id) on delete cascade,
  scheduled_at   timestamptz not null,
  bomb_starts_at timestamptz,
  status         occurrence_state not null default 'pending',
  responded_at   timestamptz
);

create index occurrence_lookup on public.occurrence (user_id, status, scheduled_at);

alter table public.task       enable row level security;
alter table public.occurrence enable row level security;

create policy own_task on public.task
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy own_occ on public.occurrence
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
