// 떠 있는 창 내용 (지침서 3-3)
// PiP 창은 하나뿐이므로, 적어둔 모든 메모를 상태별 섹션으로 나눠 보여준다.
//  · 터졌어요(마감 지남) / 진행 중(타이머 카운트다운) / 평화 모드
import { useState } from 'react'
import { useStore, useNow } from '../lib/hooks'
import { listPending, markDone, release, postpone } from '../lib/store'
import { bombState, remainingMs, formatClock, humanDur, humanElapsed } from '../lib/time'
import Bomb from './Bomb'
import ActionButtons from './ActionButtons'
import PostponeSheet from './PostponeSheet'

export default function FloatContent() {
  useStore()
  const now = useNow(1000)
  const [postponing, setPostponing] = useState(null) // occId
  const pending = listPending()

  if (pending.length === 0) {
    return <Waiting />
  }

  // 상태별로 분류 (listPending은 마감 이른 순 정렬)
  const exploded = pending.filter(({ occ, task }) => task.mode === 'bomb' && remainingMs(occ, now) <= 0)
  const active = pending.filter(({ occ, task }) => task.mode === 'bomb' && remainingMs(occ, now) > 0)
  const peace = pending.filter(({ task }) => task.mode === 'peace')

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex-1 overflow-y-auto">
        <Section title="터졌어요" count={exploded.length} tint="#fbe9e4" color="#7a2f26">
          {exploded.map(({ occ, task }) => (
            <Row
              key={occ.id}
              occ={occ}
              task={task}
              now={now}
              onPostpone={() => setPostponing(occ.id)}
            />
          ))}
        </Section>

        <Section title="진행 중" count={active.length} tint="#fff3e0" color="var(--color-flame)">
          {active.map(({ occ, task }) => (
            <Row key={occ.id} occ={occ} task={task} now={now} />
          ))}
        </Section>

        <Section title="평화 모드" count={peace.length} tint="#f2f2f2" color="var(--color-sub)">
          {peace.map(({ occ, task }) => (
            <Row key={occ.id} occ={occ} task={task} now={now} />
          ))}
        </Section>
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

// 섹션 — 항목이 있을 때만 렌더
function Section({ title, count, tint, color, children }) {
  if (!count) return null
  return (
    <section>
      <div
        className="sticky top-0 z-10 flex items-center gap-1.5 px-3 py-1"
        style={{ background: tint }}
      >
        <span className="text-[11px] font-semibold" style={{ color }}>
          {title}
        </span>
        <span className="text-[11px] tabular-nums" style={{ color, opacity: 0.7 }}>
          {count}
        </span>
      </div>
      <div className="divide-y divide-line/60">{children}</div>
    </section>
  )
}

// 메모 한 줄 — 폭탄 + 제목 + 시간, (터짐/평화는 완료·놓아주기 버튼)
function Row({ occ, task, now, onPostpone }) {
  const peace = task.mode === 'peace'
  const rem = remainingMs(occ, now)
  const exploded = task.mode === 'bomb' && rem <= 0
  const finalCountdown = !peace && rem > 0 && rem <= 10000
  const state = peace ? 'peace' : bombState(occ, task, now)

  const resolvable = exploded || peace

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center">
        <Bomb state={state} size={32} vibrate={finalCountdown} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">{task.content}</p>
        <p className="text-[11px] tabular-nums text-sub">
          {peace ? '평화 모드' : exploded ? humanElapsed(occ, now) : `${formatClock(rem)} 남음`}
        </p>
      </div>

      {resolvable ? (
        <ActionButtons
          size="sm"
          onDone={() => markDone(occ.id)}
          onRelease={() => release(occ.id)}
          onPostpone={peace ? null : onPostpone}
        />
      ) : (
        <span
          className="shrink-0 text-[15px] font-light tabular-nums tracking-tight text-ink"
          style={{ color: finalCountdown ? 'var(--color-flame)' : undefined }}
        >
          {formatClock(rem)}
        </span>
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
