// 떠 있는 창 내용 (지침서 3-3)
// PiP 창은 하나뿐이므로, 적어둔 모든 메모를 '같은 크기의 타일'로 그리드 배치한다.
// (창 크기는 개수에 맞춰 자동 조정 → FloatProvider / pip.js)
import { useState } from 'react'
import { useStore, useNow } from '../lib/hooks'
import { listPending, markDone, release, postpone } from '../lib/store'
import { bombState, remainingMs, formatClock, humanDur, humanElapsed } from '../lib/time'
import Bomb from './Bomb'
import ActionButtons from './ActionButtons'
import PostponeSheet from './PostponeSheet'

// 타일 배경 = 상태 톤
const TINT = {
  exploded: '#fbe9e4',
  urgent: '#fdeee9',
  half: '#fff6ec',
  appear: '#ffffff',
  peace: '#f4f4f4',
}

export default function FloatContent() {
  useStore()
  const now = useNow(1000)
  const [postponing, setPostponing] = useState(null) // occId
  const pending = listPending()

  if (pending.length === 0) {
    return <Waiting />
  }

  // 급한 순서로 정렬: 터짐 → 진행 중(마감 이른 순) → 평화
  const rank = ({ occ, task }) => {
    if (task.mode === 'peace') return 2
    return remainingMs(occ, now) <= 0 ? 0 : 1
  }
  const items = [...pending].sort((a, b) => rank(a) - rank(b))

  return (
    <div className="h-full w-full overflow-auto bg-white p-1.5">
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gridAutoRows: '172px',
        }}
      >
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

// 메모 타일 — 모두 같은 크기. 폭탄 / 제목 / 시간 (+ 터짐·평화는 버튼)
function Tile({ occ, task, now, onPostpone }) {
  const peace = task.mode === 'peace'
  const rem = remainingMs(occ, now)
  const exploded = task.mode === 'bomb' && rem <= 0
  const finalCountdown = !peace && rem > 0 && rem <= 10000
  const state = peace ? 'peace' : exploded ? 'exploded' : bombState(occ, task, now)
  const resolvable = exploded || peace

  return (
    <div
      className="flex flex-col items-center justify-between overflow-hidden rounded-2xl p-2 text-center ring-1 ring-line/50"
      style={{ background: TINT[state] }}
    >
      <Bomb state={state} size={46} vibrate={finalCountdown} />

      <p className="line-clamp-2 w-full text-[13px] font-semibold leading-tight text-ink">
        {task.content}
      </p>

      <p
        className="text-[12px] tabular-nums"
        style={{ color: exploded ? '#7a2f26' : finalCountdown ? 'var(--color-flame)' : 'var(--color-sub)' }}
      >
        {peace ? '평화 모드' : exploded ? humanElapsed(occ, now) : `${formatClock(rem)} 남음`}
      </p>

      {resolvable ? (
        <ActionButtons
          size="sm"
          onDone={() => markDone(occ.id)}
          onRelease={() => release(occ.id)}
          onPostpone={peace ? null : onPostpone}
        />
      ) : (
        <span className="h-8" /> /* 버튼 자리 — 타일 높이를 동일하게 유지 */
      )}
    </div>
  )
}

function Waiting() {
  useStore()
  const now = useNow(1000)
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
