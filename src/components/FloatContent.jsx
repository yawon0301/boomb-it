// 떠 있는 창 내용 (지침서 3-3) — 원래 크기(460×300)
// 적어둔 모든 메모를 '같은 크기 타일'로 배치하고, 타일마다 실시간 진행 링(TimerRing).
import { useState } from 'react'
import { useStore, useNowIn, useWinSize } from '../lib/hooks'
import { listPending, markDone, release, postpone } from '../lib/store'
import { bombState, remainingMs, formatClock, humanDur, humanElapsed } from '../lib/time'
import Bomb from './Bomb'
import TimerRing from './TimerRing'
import ActionButtons from './ActionButtons'
import PostponeSheet from './PostponeSheet'

// 원래 디자인 크기(가로형) — 이 캔버스를 창 크기에 맞춰 통째로 확대/축소한다.
const DESIGN_W = 460
const DESIGN_H = 300

// win: 떠 있는 창(PiP). 그 창의 타이머로 갱신해 백그라운드 스로틀을 피한다.
export default function FloatContent({ win }) {
  useStore()
  const now = useNowIn(win, 1000)
  const winSize = useWinSize(win)
  const [postponing, setPostponing] = useState(null) // occId
  const pending = listPending()

  // 창 크기에 맞춰 원래 디자인(460×300)을 비율 유지한 채 scale (키우면 커지고 줄이면 작아짐).
  // PiP 창(win)이 있을 때만 적용 — 없으면(/float 미리보기) 1배 고정.
  const { w, h } = win ? winSize : { w: DESIGN_W, h: DESIGN_H }
  const scale = Math.min(w / DESIGN_W, h / DESIGN_H) || 1

  // 급한 순서로: 터짐 → 진행 중(마감 이른 순) → 평화
  const rank = ({ occ, task }) => {
    if (task.mode === 'peace') return 2
    return remainingMs(occ, now) <= 0 ? 0 : 1
  }
  const items = [...pending].sort((a, b) => rank(a) - rank(b))

  // 메모 수에 맞춰 캔버스를 채움: 적으면 크게(열 1~2), 많으면 스크롤
  const cols = items.length <= 1 ? 1 : 2
  const big = items.length <= 1
  const ring = items.length <= 1 ? 148 : items.length === 2 ? 120 : 92

  return (
    <div className="grid h-full w-full place-items-center overflow-hidden bg-white">
      {/* 고정 크기 캔버스 — 내용/레이아웃은 그대로, 창 크기에 맞춰 scale만 적용 */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        {pending.length === 0 ? (
          <Waiting win={win} />
        ) : (
          <>
            <div
              className="grid h-full w-full gap-2 overflow-auto bg-white p-2"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridAutoRows: 'minmax(120px, 1fr)',
              }}
            >
              {items.map(({ occ, task }) => (
                <Tile
                  key={occ.id}
                  occ={occ}
                  task={task}
                  now={now}
                  ring={ring}
                  big={big}
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
          </>
        )}
      </div>
    </div>
  )
}

// 메모 타일 — 셀을 꽉 채움. 실시간 링 + 제목 + 시간 (터짐·평화는 버튼)
// ring: 링/캐릭터 지름(px) · big: 단일 메모일 때 글자·버튼을 크게
function Tile({ occ, task, now, onPostpone, ring = 92, big = false }) {
  const peace = task.mode === 'peace'
  const rem = remainingMs(occ, now)
  const exploded = task.mode === 'bomb' && rem <= 0
  const finalCountdown = !peace && rem > 0 && rem <= 10000
  const state = peace ? 'peace' : exploded ? 'exploded' : bombState(occ, task, now)
  const resolvable = exploded || peace

  return (
    <div className="flex h-full w-full min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl p-2 text-center ring-1 ring-line/50">
      {peace ? (
        <div className="grid shrink-0 place-items-center" style={{ height: ring, width: ring }}>
          <Bomb state="peace" size={Math.round(ring * 0.78)} />
        </div>
      ) : (
        <TimerRing
          startAt={new Date(occ.bomb_starts_at).getTime()}
          endAt={new Date(occ.scheduled_at).getTime()}
          state={state}
          size={ring}
          vibrate={finalCountdown}
        />
      )}

      <p
        className={`line-clamp-1 w-full font-semibold text-ink ${big ? 'text-[16px]' : 'text-[13px]'}`}
      >
        {task.content}
      </p>

      <p
        className={`font-medium tabular-nums ${big ? 'text-[14px]' : 'text-[12px]'}`}
        style={{ color: exploded ? '#7a2f26' : finalCountdown ? 'var(--color-flame)' : 'var(--color-sub)' }}
      >
        {peace ? '평화 모드' : exploded ? humanElapsed(occ, now) : `${formatClock(rem)} 남음`}
      </p>

      {resolvable && (
        <ActionButtons
          size={big ? 'md' : 'sm'}
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
