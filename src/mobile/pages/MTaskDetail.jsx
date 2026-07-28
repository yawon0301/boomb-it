// 모바일 상세 — 큰 폭탄 + 카운트다운 + 완료/미루기/놓아주기
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Trash2 } from 'lucide-react'
import { useStore, useNow } from '../../lib/hooks'
import { listPending, markDone, release, postponeMobile, deleteTask } from '../../lib/store'
import { bombState, remainingMs, formatClock, humanElapsed, dueDateClock } from '../../lib/time'
import TimerRing from '../../components/TimerRing'
import ActionButtons from '../../components/ActionButtons'
import PostponeSheet from '../../components/PostponeSheet'

export default function MTaskDetail() {
  useStore()
  const now = useNow(1000)
  const nav = useNavigate()
  const { id } = useParams()
  const [sheet, setSheet] = useState(false)

  const item = listPending().find((x) => x.task.id === Number(id))

  function back() {
    nav('/', { replace: true })
  }

  if (!item) {
    return (
      <Frame onBack={back}>
        <div className="grid flex-1 place-items-center px-6 text-center text-[14px] text-sub">
          이미 처리했거나 없는 할 일이에요.
        </div>
      </Frame>
    )
  }

  const { occ, task } = item
  const isPeace = task.mode === 'peace'
  const rem = remainingMs(occ, now)
  const overdue = !isPeace && rem <= 0
  const state = isPeace ? 'peace' : overdue ? 'exploded' : bombState(occ, task, now)
  const vibrate = !isPeace && !overdue && rem <= 10000

  const startAt = occ.bomb_starts_at ? new Date(occ.bomb_starts_at).getTime() : undefined
  const endAt = new Date(occ.scheduled_at).getTime()

  async function onDone() {
    await markDone(occ.id)
    back()
  }
  async function onRelease() {
    await release(occ.id)
    back()
  }
  async function onPick(dt) {
    setSheet(false)
    await postponeMobile(occ.id, dt)
    back()
  }
  async function onDelete() {
    if (!confirm('이 할 일을 삭제할까요?')) return
    await deleteTask(task.id)
    back()
  }

  return (
    <Frame onBack={back} onDelete={onDelete}>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <TimerRing
          startAt={startAt}
          endAt={endAt}
          state={state}
          size={240}
          vibrate={vibrate}
          bombNudgeX={0.024}
          bombNudgeY={-0.012}
        />
        {!isPeace && (
          <p
            className="mt-6 text-[44px] font-bold leading-none tabular-nums"
            style={{ color: overdue ? '#e5484d' : 'var(--color-ink)' }}
          >
            {overdue ? humanElapsed(occ, now) : formatClock(rem)}
          </p>
        )}
        <p className="mt-4 text-[19px] font-semibold text-ink">{task.content}</p>
        {!isPeace ? (
          <p className="mt-1 text-[14px] tabular-nums text-sub">{dueDateClock(occ)} 마감</p>
        ) : (
          <p className="mt-1 text-[14px] text-sub">평화 모드 — 터지지 않아요</p>
        )}
      </div>

      <div className="shrink-0 px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">
        <ActionButtons onDone={onDone} onPostpone={() => setSheet(true)} onRelease={onRelease} />
      </div>

      {sheet && <PostponeSheet onPick={onPick} onClose={() => setSheet(false)} />}
    </Frame>
  )
}

function Frame({ children, onBack, onDelete }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[520px] flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between px-3">
        <button
          onClick={onBack}
          aria-label="뒤로"
          className="grid h-10 w-10 place-items-center rounded-full text-ink transition active:bg-fill"
        >
          <ChevronLeft size={24} />
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            aria-label="삭제"
            className="grid h-10 w-10 place-items-center rounded-full text-sub transition active:bg-fill"
          >
            <Trash2 size={20} />
          </button>
        )}
      </header>
      {children}
    </div>
  )
}
