// 모바일 목록 한 줄 — 작은 폭탄 + 할 일 + 상태 한 줄 + 시각 + 수정/삭제 아이콘
//  · 마감 지난 폭탄: "N시간 지남"을 빨간색으로, 오른쪽에 주황색 점
//  · 평화 모드: 웃는 폭탄, 시간 표시 없음
//  · 오른쪽 끝: 작은 수정(연필)·삭제(휴지통) 버튼 (행 탭과 분리)
import { Pencil, Trash2 } from 'lucide-react'
import Bomb from '../../components/Bomb'
import { bombState, remainingMs, humanRemain, humanElapsed, dueClock } from '../../lib/time'

const RED = '#e5484d'

export default function MTaskRow({ occ, task, now, onOpen, onEdit, onDelete }) {
  const rem = remainingMs(occ, now)
  const isPeace = task.mode === 'peace'
  const overdue = !isPeace && rem <= 0
  const finalCountdown = !isPeace && rem > 0 && rem <= 10000
  const state = isPeace ? 'peace' : overdue ? 'exploded' : bombState(occ, task, now)

  let statusLine = '평화 모드'
  let statusColor = 'var(--color-sub)'
  if (!isPeace) {
    if (overdue) {
      statusLine = humanElapsed(occ, now) // "N시간 지남"
      statusColor = RED
    } else {
      statusLine = humanRemain(occ, now) // "N분 남음"
    }
  }

  return (
    <div className="flex w-full items-center gap-2 px-4 py-2.5">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left transition active:opacity-60"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center">
          <Bomb state={state} size={40} vibrate={finalCountdown} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-medium text-ink">{task.content}</span>
          <span
            className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] tabular-nums"
            style={{ color: statusColor }}
          >
            {statusLine}
            {!isPeace && !overdue && <span className="text-sub">· {dueClock(occ)}</span>}
            {overdue && (
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: 'var(--color-flame)' }}
              />
            )}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onEdit}
          aria-label="수정"
          className="grid h-9 w-9 place-items-center rounded-full text-sub transition active:bg-fill"
        >
          <Pencil size={17} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="삭제"
          className="grid h-9 w-9 place-items-center rounded-full text-sub transition active:bg-fill"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  )
}
