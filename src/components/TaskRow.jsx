// 체크리스트 한 줄 — 인스타 DM 밀도 참고 (지침서 3-2)
import { Check } from 'lucide-react'
import Bomb from './Bomb'
import { bombState, remainingMs, humanRemain, humanElapsed, dueClock } from '../lib/time'

export default function TaskRow({ occ, task, now, onOpen }) {
  const resolved = occ.status !== 'pending'
  const done = occ.status === 'done'
  const state = resolved ? (task.mode === 'peace' ? 'peace' : 'exploded') : bombState(occ, task, now)
  const rem = remainingMs(occ, now)
  const exploded = task.mode === 'bomb' && rem <= 0
  const neglected = !resolved && exploded
  const finalCountdown = !resolved && task.mode === 'bomb' && rem > 0 && rem <= 10000

  let statusLine
  if (resolved) statusLine = done ? '완료됨' : '놓아줌'
  else if (task.mode === 'peace') statusLine = '평화 모드'
  else if (exploded) statusLine = humanElapsed(occ, now)
  else statusLine = humanRemain(occ, now)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-fill/60"
    >
      <span className="relative grid h-14 w-14 shrink-0 place-items-center">
        <Bomb state={done ? 'peace' : state} size={52} vibrate={finalCountdown} />
        {done && (
          <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#1b7f3b] text-white">
            <Check size={13} strokeWidth={3} />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[15px] font-medium ${
            done ? 'text-sub line-through' : 'text-ink'
          }`}
        >
          {task.content}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-sub">{statusLine}</span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-1">
        {task.mode === 'bomb' && (
          <span className="text-[13px] tabular-nums text-sub">{dueClock(occ)}</span>
        )}
        {neglected && (
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-flame)' }} />
        )}
      </span>
    </button>
  )
}
