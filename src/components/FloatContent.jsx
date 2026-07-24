// 떠 있는 창 내용 (지침서 3-3) — 원래 크기(460×300)
// 적어둔 모든 메모를 '같은 크기 타일'로 배치하고, 타일마다 실시간 진행 링(TimerRing).
import { useState } from 'react'
import { useStore, useNowIn } from '../lib/hooks'
import { listPending, markDone, release, postpone } from '../lib/store'
import { bombState, remainingMs, formatClock, humanDur, humanElapsed } from '../lib/time'
import Bomb from './Bomb'
import TimerRing from './TimerRing'
import ActionButtons from './ActionButtons'
import PostponeSheet from './PostponeSheet'

// win: 떠 있는 창(PiP). 그 창의 타이머로 갱신해 백그라운드 스로틀을 피한다.
export default function FloatContent({ win }) {
  useStore()
  const now = useNowIn(win, 1000)
  const [postponing, setPostponing] = useState(null) // occId
  const pending = listPending()

  if (pending.length === 0) {
    return <Waiting win={win} />
  }

  // 급한 순서로: 터짐 → 진행 중(마감 이른 순) → 평화
  const rank = ({ occ, task }) => {
    if (task.mode === 'peace') return 2
    return remainingMs(occ, now) <= 0 ? 0 : 1
  }
  const items = [...pending].sort((a, b) => rank(a) - rank(b))

  return (
    <div className="h-full w-full overflow-auto bg-white p-2">
      <div className="flex flex-wrap content-center justify-center gap-2" style={{ minHeight: '100%' }}>
        {items.map(({ occ, task }) => (
          <Tile
            key={occ.id}
            occ={occ}
            task={task}
            now={now}
            onPostpone={() => setPostponing(occ.id)}
          />
        ))}
      </div>

      {postponing != null && (
        <PostponeSheet
          onClose={() => setPostponing(null)}
          onPick={(date) => {
            postpone(postponing, date)
            setPostponing(null)
          }}
        />
      )}
    </div>
  )
}

// 메모 타일 — 모두 같은 크기. 실시간 링 + 제목 + 시간 (터짐·평화는 버튼)
function Tile({ occ, task, now, onPostpone }) {
  const peace = task.mode === 'peace'
  const rem = remainingMs(occ, now)
  const exploded = task.mode === 'bomb' && rem <= 0
  const finalCountdown = !peace && rem > 0 && rem <= 10000
  const state = peace ? 'peace' : exploded ? 'exploded' : bombState(occ, task, now)
  const resolvable = exploded || peace

  return (
    <div className="flex w-[138px] flex-col items-center gap-1 rounded-2xl p-1.5 text-center ring-1 ring-line/50">
      {peace ? (
        <div className="grid h-[92px] w-[92px] place-items-center">
          <Bomb state="peace" size={72} />
        </div>
      ) : (
        <TimerRing
          startAt={new Date(occ.bomb_starts_at).getTime()}
          endAt={new Date(occ.scheduled_at).getTime()}
          state={state}
          size={92}
          vibrate={finalCountdown}
        />
      )}

      <p className="line-clamp-1 w-full text-[13px] font-semibold text-ink">{task.content}</p>

      <p
        className="text-[12px] font-medium tabular-nums"
        style={{ color: exploded ? '#7a2f26' : finalCountdown ? 'var(--color-flame)' : 'var(--color-sub)' }}
      >
        {peace ? '평화 모드' : exploded ? humanElapsed(occ, now) : `${formatClock(rem)} 남음`}
      </p>

      {resolvable && (
        <ActionButtons
          size="sm"
          onDone={() => markDone(occ.id)}
          onRelease={() => release(occ.id)}
          onPostpone={peace ? null : onPostpone}
        />
      )}
    </div>
  )
}

function Waiting({ win }) {
  useStore()
  const now = useNowIn(win, 1000)
  const pending = listPending()
  const next = pending
    .filter((p) => p.task.mode === 'bomb')
    .map((p) => remainingMs(p.occ, now))
    .filter((ms) => ms > 0)
    .sort((a, b) => a - b)[0]

  return (
    <div className="flex h-full w-full flex-row items-center justify-center gap-4 bg-white px-6 text-center">
      <Bomb state="peace" size={90} />
      {next ? (
        <p className="text-[15px] text-sub">
          다음 폭탄까지 <b className="text-ink">{humanDur(next)}</b>
        </p>
      ) : (
        <p className="text-[14px] text-sub">지금은 조용합니다.<br />할 일이 없어요.</p>
      )}
    </div>
  )
}
