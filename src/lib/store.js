// ─────────────────────────────────────────────────────────────
// boomb-it 데이터 계층 — localStorage 어댑터 (MVP)
//
// 기획서 4장의 task / occurrence 2-테이블 모델을 그대로 옮겼습니다.
// Supabase 전환 시 아래 공개 함수들의 시그니처만 유지하면
// 이 파일 하나만 교체해서 붙일 수 있습니다.
// ─────────────────────────────────────────────────────────────

const LS_KEY = 'boomb-it.v1'

function emptyState() {
  return { tasks: [], occurrences: [], seq: 1, settings: { notifyAsked: false } }
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return { ...emptyState(), ...JSON.parse(raw) }
  } catch {
    /* 손상된 데이터는 무시하고 새로 시작 */
  }
  return emptyState()
}

let state = load()
let version = 0
const listeners = new Set()

function persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {
    /* 저장 실패(용량 등)는 조용히 넘어감 */
  }
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

// ── 날짜 유틸 (로컬 타임존 기준) ──────────────────────────────
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
function nextId() {
  return state.seq++
}

// ── task ─────────────────────────────────────────────────────
export function getTasks() {
  return state.tasks
}
export function getTask(id) {
  return state.tasks.find((t) => t.id === Number(id)) || null
}

function firstScheduled(task) {
  if (task.repeat_rule === 'daily') {
    let s = scheduledDateTime(todayStr(), task.due_time)
    // 오늘 시간이 이미 지났으면 내일치로 시작 (바로 터진 채로 등장하지 않게)
    if (s.getTime() < Date.now()) s = new Date(s.getTime() + 86400000)
    return s
  }
  return scheduledDateTime(task.due_date ?? todayStr(), task.due_time)
}

function buildOccurrence(task, scheduled) {
  const start =
    task.mode === 'peace'
      ? null
      : new Date(scheduled.getTime() - task.timer_minutes * 60000)
  return {
    id: nextId(),
    task_id: task.id,
    scheduled_at: scheduled.toISOString(),
    bomb_starts_at: start ? start.toISOString() : null,
    status: 'pending',
    responded_at: null,
  }
}

export function createTask(input) {
  const task = {
    id: nextId(),
    content: String(input.content || '').trim().slice(0, 500),
    due_time: input.due_time, // "HH:MM"
    due_date: input.repeat_rule === 'daily' ? null : (input.due_date ?? todayStr()),
    repeat_rule: input.repeat_rule ?? 'none',
    mode: input.mode ?? 'bomb',
    timer_minutes: input.mode === 'peace' ? null : (input.timer_minutes ?? 60),
    is_active: true,
    created_at: new Date().toISOString(),
  }
  state.tasks.push(task)
  const occ = buildOccurrence(task, firstScheduled(task))
  state.occurrences.push(occ)
  persist()
  return { task, occ }
}

export function updateTask(id, patch) {
  const task = getTask(id)
  if (!task) return
  Object.assign(task, patch)
  if (task.mode === 'peace') task.timer_minutes = null

  // 마감·타이머·모드가 바뀌면 진행 중(pending) occurrence의 시각을 재계산
  const occ = state.occurrences.find(
    (o) => o.task_id === task.id && o.status === 'pending',
  )
  if (occ) {
    const sched = firstScheduled(task)
    occ.scheduled_at = sched.toISOString()
    occ.bomb_starts_at =
      task.mode === 'peace'
        ? null
        : new Date(sched.getTime() - task.timer_minutes * 60000).toISOString()
  }
  persist()
}

export function deleteTask(id) {
  const nid = Number(id)
  state.tasks = state.tasks.filter((t) => t.id !== nid)
  state.occurrences = state.occurrences.filter((o) => o.task_id !== nid)
  persist()
}

// ── occurrence ───────────────────────────────────────────────
export function taskOf(occ) {
  return state.tasks.find((t) => t.id === occ.task_id) || null
}

// 진행 중(대기) 목록 — 마감 가까운 순
export function listPending() {
  return state.occurrences
    .filter((o) => o.status === 'pending')
    .map((o) => ({ occ: o, task: taskOf(o) }))
    .filter((x) => x.task && x.task.is_active)
    .sort((a, b) => new Date(a.occ.scheduled_at) - new Date(b.occ.scheduled_at))
}

// 오늘 처리한(완료/놓아줌) 항목 — 체크리스트 하단에 흐리게
export function listResolvedToday() {
  const today = todayStr()
  return state.occurrences
    .filter(
      (o) =>
        o.status !== 'pending' &&
        o.responded_at &&
        sameDay(o.responded_at, today),
    )
    .map((o) => ({ occ: o, task: taskOf(o) }))
    .filter((x) => x.task)
    .sort((a, b) => new Date(b.occ.responded_at) - new Date(a.occ.responded_at))
}

function spawnNextDaily(task, fromOcc) {
  if (task.repeat_rule !== 'daily') return
  const next = new Date(new Date(fromOcc.scheduled_at).getTime() + 86400000)
  const nextDay = dayStr(next)
  if (
    state.occurrences.some(
      (o) => o.task_id === task.id && sameDay(o.scheduled_at, nextDay),
    )
  )
    return
  state.occurrences.push(
    buildOccurrence(task, scheduledDateTime(nextDay, task.due_time)),
  )
}

export function markDone(occId) {
  const occ = state.occurrences.find((o) => o.id === occId)
  if (!occ) return
  occ.status = 'done'
  occ.responded_at = new Date().toISOString()
  spawnNextDaily(taskOf(occ), occ)
  persist()
}

export function release(occId) {
  const occ = state.occurrences.find((o) => o.id === occId)
  if (!occ) return
  occ.status = 'released'
  occ.responded_at = new Date().toISOString()
  spawnNextDaily(taskOf(occ), occ)
  persist()
}

// 미루기 — 새 줄을 만들지 않고 시각만 갈아끼움 (기획서 4-5)
export function postpone(occId, newScheduledAt) {
  const occ = state.occurrences.find((o) => o.id === occId)
  if (!occ) return
  const task = taskOf(occ)
  const start =
    task.mode === 'peace'
      ? null
      : new Date(newScheduledAt.getTime() - task.timer_minutes * 60000)
  occ.scheduled_at = newScheduledAt.toISOString()
  occ.bomb_starts_at = start ? start.toISOString() : null
  occ.status = 'pending'
  occ.responded_at = null
  persist()
}

// ── 반복 발생 생성 (기획서 5-4) — 앱 열릴 때 1회 ──────────────
export function ensureDailyOccurrences() {
  const today = todayStr()
  let changed = false
  for (const task of state.tasks) {
    if (!task.is_active || task.repeat_rule !== 'daily') continue
    const has = state.occurrences.some(
      (o) => o.task_id === task.id && sameDay(o.scheduled_at, today),
    )
    if (!has) {
      state.occurrences.push(
        buildOccurrence(task, scheduledDateTime(today, task.due_time)),
      )
      changed = true
    }
  }
  if (changed) persist()
}

// ── 테스트용 — N초 뒤 터지는 폭탄 ────────────────────────────
export function addTestBomb(seconds = 10) {
  const scheduled = new Date(Date.now() + seconds * 1000)
  const task = {
    id: nextId(),
    content: `💣 ${seconds}초 폭발 테스트`,
    due_time: `${pad(scheduled.getHours())}:${pad(scheduled.getMinutes())}`,
    due_date: todayStr(),
    repeat_rule: 'none',
    mode: 'bomb',
    timer_minutes: 20,
    is_active: true,
    created_at: new Date().toISOString(),
  }
  state.tasks.push(task)
  state.occurrences.push({
    id: nextId(),
    task_id: task.id,
    scheduled_at: scheduled.toISOString(),
    bomb_starts_at: new Date(scheduled.getTime() - 20 * 60000).toISOString(),
    status: 'pending',
    responded_at: null,
  })
  persist()
}

// ── 설정 ─────────────────────────────────────────────────────
export function getSettings() {
  return state.settings
}
export function setSettings(patch) {
  Object.assign(state.settings, patch)
  persist()
}
