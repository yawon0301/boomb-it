// ─────────────────────────────────────────────────────────────
// boomb-it 데이터 계층 — Supabase 백엔드 (task / occurrence)
//
// 컴포넌트가 쓰는 동기 읽기 API(listPending 등)는 그대로 두고,
// 메모리 미러(state)를 Supabase와 동기화합니다.
//  · 읽기: state에서 즉시 (동기)
//  · 쓰기: state를 갱신하고 Supabase에 반영 (async)
//  · 로그인/로그아웃(auth 변경) 시 해당 유저 데이터로 다시 로드
// ─────────────────────────────────────────────────────────────
import { supabase } from './supabase'

const LEGACY_KEY = 'boomb-it.v1' // 예전 localStorage 데이터
const MIGRATED_KEY = 'boomb-it.migrated'
const SETTINGS_KEY = 'boomb-it.settings'

let state = { tasks: [], occurrences: [], loaded: false }
let userId = null
let version = 0
let inited = false
const listeners = new Set()

function bump() {
  version++
  listeners.forEach((l) => l())
}
export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function getVersion() {
  return version
}
export function getState() {
  return state
}
export function isLoaded() {
  return state.loaded
}

// ── 날짜 유틸 (로컬 타임존) ───────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')
export function dayStr(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export function todayStr() {
  return dayStr(new Date())
}
export function scheduledDateTime(dstr, timeStr) {
  const [y, m, d] = dstr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}
function sameDay(iso, dstr) {
  return dayStr(new Date(iso)) === dstr
}

function firstScheduled(task) {
  if (task.repeat_rule === 'daily') {
    let s = scheduledDateTime(todayStr(), task.due_time)
    if (s.getTime() < Date.now()) s = new Date(s.getTime() + 86400000)
    return s
  }
  return scheduledDateTime(task.due_date ?? todayStr(), task.due_time)
}

function occRow(task, scheduled) {
  const start =
    task.mode === 'peace'
      ? null
      : new Date(scheduled.getTime() - task.timer_minutes * 60000)
  return {
    user_id: userId,
    task_id: task.id,
    scheduled_at: scheduled.toISOString(),
    bomb_starts_at: start ? start.toISOString() : null,
    status: 'pending',
    responded_at: null,
  }
}

// ── 초기화 / 인증 연동 ────────────────────────────────────────
export async function initStore() {
  if (inited) return
  inited = true
  if (!supabase) {
    state.loaded = true
    bump()
    return
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  await loadForUser(user?.id ?? null)
  supabase.auth.onAuthStateChange((_event, session) => {
    const uid = session?.user?.id ?? null
    if (uid !== userId) loadForUser(uid)
  })
}

async function loadForUser(uid) {
  userId = uid
  state = { tasks: [], occurrences: [], loaded: false }
  bump()
  if (!supabase || !uid) {
    state = { tasks: [], occurrences: [], loaded: true }
    bump()
    return
  }
  try {
    await maybeMigrateLegacy(uid)
    const [tRes, oRes] = await Promise.all([
      supabase.from('task').select('*').eq('user_id', uid),
      supabase.from('occurrence').select('*').eq('user_id', uid),
    ])
    state = {
      tasks: tRes.data ?? [],
      occurrences: oRes.data ?? [],
      loaded: true,
    }
    bump()
    await ensureDailyOccurrences()
  } catch {
    state = { tasks: [], occurrences: [], loaded: true }
    bump()
  }
}

// 예전 localStorage 할 일을 최초 1회 DB로 이관 (기기별 1회)
async function maybeMigrateLegacy(uid) {
  if (localStorage.getItem(MIGRATED_KEY)) return
  let legacy = null
  try {
    legacy = JSON.parse(localStorage.getItem(LEGACY_KEY))
  } catch {
    /* ignore */
  }
  if (!legacy || !Array.isArray(legacy.tasks) || legacy.tasks.length === 0) {
    localStorage.setItem(MIGRATED_KEY, '1')
    return
  }
  try {
    const { count } = await supabase
      .from('task')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
    if (count && count > 0) {
      localStorage.setItem(MIGRATED_KEY, '1')
      return
    }
    const idMap = {}
    for (const t of legacy.tasks) {
      const { data } = await supabase
        .from('task')
        .insert({
          user_id: uid,
          content: t.content,
          due_time: t.due_time,
          due_date: t.due_date,
          repeat_rule: t.repeat_rule,
          mode: t.mode,
          timer_minutes: t.timer_minutes,
          is_active: t.is_active ?? true,
        })
        .select()
        .single()
      if (data) idMap[t.id] = data.id
    }
    const rows = (legacy.occurrences ?? [])
      .filter((o) => idMap[o.task_id])
      .map((o) => ({
        user_id: uid,
        task_id: idMap[o.task_id],
        scheduled_at: o.scheduled_at,
        bomb_starts_at: o.bomb_starts_at,
        status: o.status,
        responded_at: o.responded_at,
      }))
    if (rows.length) await supabase.from('occurrence').insert(rows)
  } catch {
    /* 이관 실패는 조용히 넘어감 */
  }
  localStorage.setItem(MIGRATED_KEY, '1')
}

// ── task (읽기: 동기) ─────────────────────────────────────────
export function getTasks() {
  return state.tasks
}
export function getTask(id) {
  return state.tasks.find((t) => t.id === Number(id)) || null
}
export function taskOf(occ) {
  return state.tasks.find((t) => t.id === occ.task_id) || null
}

// ── task (쓰기: async) ────────────────────────────────────────
export async function createTask(input) {
  if (!supabase || !userId) return
  const row = {
    user_id: userId,
    content: String(input.content || '').trim().slice(0, 500),
    due_time: input.due_time,
    due_date: input.repeat_rule === 'daily' ? null : (input.due_date ?? todayStr()),
    repeat_rule: input.repeat_rule ?? 'none',
    mode: input.mode ?? 'bomb',
    timer_minutes: input.mode === 'peace' ? null : (input.timer_minutes ?? 60),
    is_active: true,
  }
  const { data: task, error } = await supabase.from('task').insert(row).select().single()
  if (error || !task) return
  state.tasks = [...state.tasks, task]
  const { data: occ } = await supabase
    .from('occurrence')
    .insert(occRow(task, firstScheduled(task)))
    .select()
    .single()
  if (occ) state.occurrences = [...state.occurrences, occ]
  bump()
}

export async function updateTask(id, patch) {
  const task = getTask(id)
  if (!task || !supabase) return
  const merged = { ...task, ...patch }
  if (merged.mode === 'peace') merged.timer_minutes = null
  const upd = {
    content: merged.content,
    due_time: merged.due_time,
    due_date: merged.repeat_rule === 'daily' ? null : merged.due_date,
    repeat_rule: merged.repeat_rule,
    mode: merged.mode,
    timer_minutes: merged.timer_minutes,
    is_active: merged.is_active,
  }
  await supabase.from('task').update(upd).eq('id', task.id)
  Object.assign(task, upd)

  const occ = state.occurrences.find(
    (o) => o.task_id === task.id && o.status === 'pending',
  )
  if (occ) {
    const sched = firstScheduled(task)
    const p2 = {
      scheduled_at: sched.toISOString(),
      bomb_starts_at:
        task.mode === 'peace'
          ? null
          : new Date(sched.getTime() - task.timer_minutes * 60000).toISOString(),
    }
    await supabase.from('occurrence').update(p2).eq('id', occ.id)
    Object.assign(occ, p2)
  }
  bump()
}

export async function deleteTask(id) {
  const nid = Number(id)
  if (!supabase) return
  await supabase.from('task').delete().eq('id', nid)
  state.tasks = state.tasks.filter((t) => t.id !== nid)
  state.occurrences = state.occurrences.filter((o) => o.task_id !== nid)
  bump()
}

// ── occurrence (읽기: 동기) ───────────────────────────────────
export function listPending() {
  return state.occurrences
    .filter((o) => o.status === 'pending')
    .map((o) => ({ occ: o, task: taskOf(o) }))
    .filter((x) => x.task && x.task.is_active)
    .sort((a, b) => new Date(a.occ.scheduled_at) - new Date(b.occ.scheduled_at))
}

export function listResolvedToday() {
  const today = todayStr()
  return state.occurrences
    .filter(
      (o) => o.status !== 'pending' && o.responded_at && sameDay(o.responded_at, today),
    )
    .map((o) => ({ occ: o, task: taskOf(o) }))
    .filter((x) => x.task)
    .sort((a, b) => new Date(b.occ.responded_at) - new Date(a.occ.responded_at))
}

// 상태별 전체 기록 (완료됨='done' · 놓아줌='released') — 처리 시각 내림차순
export function listByStatus(status) {
  return state.occurrences
    .filter((o) => o.status === status && o.responded_at)
    .map((o) => ({ occ: o, task: taskOf(o) }))
    .filter((x) => x.task)
    .sort((a, b) => new Date(b.occ.responded_at) - new Date(a.occ.responded_at))
}

// ── occurrence (쓰기: async) ──────────────────────────────────
async function spawnNextDaily(task, fromOcc) {
  if (!task || task.repeat_rule !== 'daily') return
  const next = new Date(new Date(fromOcc.scheduled_at).getTime() + 86400000)
  const nextDay = dayStr(next)
  if (state.occurrences.some((o) => o.task_id === task.id && sameDay(o.scheduled_at, nextDay)))
    return
  const { data } = await supabase
    .from('occurrence')
    .insert(occRow(task, scheduledDateTime(nextDay, task.due_time)))
    .select()
    .single()
  if (data) state.occurrences = [...state.occurrences, data]
}

async function respond(occId, status) {
  const occ = state.occurrences.find((o) => o.id === occId)
  if (!occ || !supabase) return
  const responded_at = new Date().toISOString()
  await supabase.from('occurrence').update({ status, responded_at }).eq('id', occId)
  occ.status = status
  occ.responded_at = responded_at
  await spawnNextDaily(taskOf(occ), occ)
  bump()
}
export function markDone(occId) {
  return respond(occId, 'done')
}
export function release(occId) {
  return respond(occId, 'released')
}

// 미루기 — 새 줄을 만들지 않고 시각만 갱신 (기획서 4-5)
// 미루면 status가 다시 'pending'이라 DB에 이력이 안 남으므로, 분석용 로그를 로컬에 기록
export async function postpone(occId, newScheduledAt) {
  const occ = state.occurrences.find((o) => o.id === occId)
  if (!occ || !supabase) return
  const task = taskOf(occ)
  const start =
    task.mode === 'peace'
      ? null
      : new Date(newScheduledAt.getTime() - task.timer_minutes * 60000)
  const p = {
    scheduled_at: newScheduledAt.toISOString(),
    bomb_starts_at: start ? start.toISOString() : null,
    status: 'pending',
    responded_at: null,
  }
  await supabase.from('occurrence').update(p).eq('id', occId)
  Object.assign(occ, p)
  pushPostponeLog({
    content: task?.content ?? '',
    postponed_at: new Date().toISOString(), // 미룬 시각
    to: newScheduledAt.toISOString(), // 새 마감
  })
  bump()
}

// ── 미루기 기록 (localStorage — 기기별) ───────────────────────
const POSTPONE_LOG_KEY = 'boomb-it.postponeLog'
function pushPostponeLog(entry) {
  try {
    const log = JSON.parse(localStorage.getItem(POSTPONE_LOG_KEY)) || []
    log.unshift(entry)
    localStorage.setItem(POSTPONE_LOG_KEY, JSON.stringify(log.slice(0, 200)))
  } catch {
    /* ignore */
  }
}
export function listPostponed() {
  try {
    const log = JSON.parse(localStorage.getItem(POSTPONE_LOG_KEY)) || []
    return Array.isArray(log) ? log : []
  } catch {
    return []
  }
}

// ── 반복 발생 생성 (기획서 5-4) — 로드 시 1회 ─────────────────
export async function ensureDailyOccurrences() {
  if (!supabase || !userId) return
  const today = todayStr()
  const rows = []
  for (const task of state.tasks) {
    if (!task.is_active || task.repeat_rule !== 'daily') continue
    const has = state.occurrences.some(
      (o) => o.task_id === task.id && sameDay(o.scheduled_at, today),
    )
    if (!has) rows.push(occRow(task, scheduledDateTime(today, task.due_time)))
  }
  if (rows.length === 0) return
  const { data } = await supabase.from('occurrence').insert(rows).select()
  if (data && data.length) {
    state.occurrences = [...state.occurrences, ...data]
    bump()
  }
}

// ── 테스트용 — N초 뒤 터지는 폭탄 ────────────────────────────
export async function addTestBomb(seconds = 10) {
  if (!supabase || !userId) return
  const scheduled = new Date(Date.now() + seconds * 1000)
  const { data: task } = await supabase
    .from('task')
    .insert({
      user_id: userId,
      content: `💣 ${seconds}초 폭발 테스트`,
      due_time: `${pad(scheduled.getHours())}:${pad(scheduled.getMinutes())}`,
      due_date: todayStr(),
      repeat_rule: 'none',
      mode: 'bomb',
      timer_minutes: 20,
      is_active: true,
    })
    .select()
    .single()
  if (!task) return
  state.tasks = [...state.tasks, task]
  const { data: occ } = await supabase
    .from('occurrence')
    .insert({
      user_id: userId,
      task_id: task.id,
      scheduled_at: scheduled.toISOString(),
      bomb_starts_at: new Date(scheduled.getTime() - 20 * 60000).toISOString(),
      status: 'pending',
      responded_at: null,
    })
    .select()
    .single()
  if (occ) state.occurrences = [...state.occurrences, occ]
  bump()
}

// ── 설정 (localStorage — DB 아님) ─────────────────────────────
export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}
  } catch {
    return {}
  }
}
export function setSettings(patch) {
  const s = { ...getSettings(), ...patch }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}
