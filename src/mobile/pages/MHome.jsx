// 모바일 메인 — 가장 급한 폭탄 하나(크게) + 나머지 목록 + 하단 입력창
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useStore, useNow } from '../../lib/hooks'
import { listPending, createTaskMobile, deleteTask, isLoaded } from '../../lib/store'
import { bombState, remainingMs, formatClock, humanElapsed, dueDateClock } from '../../lib/time'
import TimerRing from '../../components/TimerRing'
import BottomInput from '../../components/BottomInput'
import MTaskRow from '../components/MTaskRow'
import MConfirm from '../components/MConfirm'

export default function MHome() {
  useStore()
  const now = useNow(1000)
  const nav = useNavigate()
  const [confirm, setConfirm] = useState(null) // { id, content } 삭제 확인 대상

  const pending = listPending()
  const bombs = pending.filter(({ task }) => task.mode === 'bomb')
  // 가장 급한 폭탄 = 마감이 가장 이른 폭탄 (listPending 은 scheduled_at 오름차순)
  const hero = bombs[0] ?? null
  const rest = pending.filter((x) => x.occ.id !== hero?.occ.id)

  // 빠른 추가 — 기본: 폭탄, 1시간 뒤 마감. bomb_starts_at 은 만든 시점(지금).
  async function quickAdd(content) {
    const due = new Date(Date.now() + 60 * 60000)
    const hh = String(due.getHours()).padStart(2, '0')
    const mm = String(due.getMinutes()).padStart(2, '0')
    await createTaskMobile({ content, due_time: `${hh}:${mm}`, mode: 'bomb' })
  }

  const askDelete = (task) => setConfirm({ id: task.id, content: task.content })
  const goEdit = (task) => nav(`/task/${task.id}/edit`)

  async function doDelete() {
    const id = confirm.id
    setConfirm(null)
    await deleteTask(id)
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between px-4">
        <h1 className="text-[20px] font-extrabold tracking-tight text-ink">붐잇</h1>
        <button
          onClick={() => nav('/new')}
          aria-label="할 일 추가"
          className="grid h-10 w-10 place-items-center rounded-full text-ink transition active:bg-fill"
        >
          <Plus size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {!isLoaded() ? (
          <div className="px-4 py-20 text-center text-[13px] text-sub">불러오는 중…</div>
        ) : (
          <>
            {hero ? (
              <Hero
                item={hero}
                now={now}
                onOpen={() => nav(`/task/${hero.task.id}`)}
                onEdit={() => goEdit(hero.task)}
                onDelete={() => askDelete(hero.task)}
              />
            ) : (
              <EmptyHero />
            )}

            {rest.length > 0 && (
              <div className="mt-1 border-t border-line pt-1">
                {rest.map(({ occ, task }) => (
                  <MTaskRow
                    key={occ.id}
                    occ={occ}
                    task={task}
                    now={now}
                    onOpen={() => nav(`/task/${task.id}`)}
                    onEdit={() => goEdit(task)}
                    onDelete={() => askDelete(task)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <BottomInput onSubmit={quickAdd} />

      {confirm && (
        <MConfirm
          message={`"${confirm.content}"\n삭제하시겠습니까?`}
          onYes={doDelete}
          onNo={() => setConfirm(null)}
        />
      )}
    </>
  )
}

// 가장 급한 폭탄 — 얇은 링 + 폭탄 + 큰 카운트다운 + 내용 + 마감 시각 (+ 수정/삭제)
function Hero({ item, now, onOpen, onEdit, onDelete }) {
  const { occ, task } = item
  const rem = remainingMs(occ, now)
  const overdue = rem <= 0
  const state = overdue ? 'exploded' : bombState(occ, task, now)
  const vibrate = !overdue && rem <= 10000

  const startAt = occ.bomb_starts_at ? new Date(occ.bomb_starts_at).getTime() : undefined
  const endAt = new Date(occ.scheduled_at).getTime()

  return (
    <div className="relative">
      <div className="absolute right-3 top-1 z-10 flex gap-1">
        <button
          onClick={onEdit}
          aria-label="수정"
          className="grid h-9 w-9 place-items-center rounded-full text-sub transition active:bg-fill"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={onDelete}
          aria-label="삭제"
          className="grid h-9 w-9 place-items-center rounded-full text-sub transition active:bg-fill"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-col items-center px-6 pt-6 pb-5 text-center transition active:bg-fill/40"
      >
        <TimerRing
          startAt={startAt}
          endAt={endAt}
          state={state}
          size={200}
          vibrate={vibrate}
          bombNudgeX={0.024}
          bombNudgeY={-0.012}
        />

        <p
          className="mt-5 text-[40px] font-bold leading-none tabular-nums"
          style={{ color: overdue ? '#e5484d' : 'var(--color-ink)' }}
        >
          {overdue ? humanElapsed(occ, now) : formatClock(rem)}
        </p>
        <p className="mt-3 line-clamp-2 text-[17px] font-semibold text-ink">{task.content}</p>
        <p className="mt-1 text-[13px] tabular-nums text-sub">{dueDateClock(occ)} 마감</p>
      </button>
    </div>
  )
}

function EmptyHero() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="text-[15px] font-medium text-ink">타는 중인 폭탄이 없어요</p>
      <p className="text-[13px] leading-relaxed text-sub">
        아래에 할 일을 적으면
        <br />첫 폭탄이 만들어집니다.
      </p>
    </div>
  )
}
