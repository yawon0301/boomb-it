// 떠 있는 창 내용 (지침서 3-3) — 가로형(landscape) 레이아웃
// PiP 포털과 /float 미리보기가 함께 사용
import { useState } from 'react'
import { useStore, useNow } from '../lib/hooks'
import { listPending, markDone, release, postpone } from '../lib/store'
import {
  bombState,
  progress,
  remainingMs,
  formatClock,
  humanDur,
  humanElapsed,
} from '../lib/time'
import Bomb from './Bomb'
import TimerRing from './TimerRing'
import ActionButtons from './ActionButtons'
import PostponeSheet from './PostponeSheet'

// 배경색 = 폭탄 상태색 (몸통 색 흐름: 흰 → 살구 → 붉음 → 그을음)
const STATE_BG = {
  appear: '#ffffff',
  half: '#f6d9c6',
  urgent: '#de8877',
  exploded: '#b8b8b8',
  peace: '#ffffff',
}

export default function FloatContent() {
  useStore()
  const now = useNow(1000)
  const [postponing, setPostponing] = useState(null) // occId
  const pending = listPending()

  if (pending.length === 0) {
    return <Waiting />
  }

  const [topEntry, ...rest] = pending
  const { occ, task } = topEntry
  const rem = remainingMs(occ, now)
  const exploded = task.mode === 'bomb' && rem <= 0
  const peace = task.mode === 'peace'
  const finalCountdown = !peace && rem > 0 && rem <= 10000 // 마지막 10초 연속 진동
  const state = peace ? 'peace' : bombState(occ, task, now)

  return (
    <div
      className="flex h-full w-full flex-col transition-colors duration-700"
      style={{ background: STATE_BG[state] }}
    >
      {/* 메인 — 가로 배치: 왼쪽 폭탄 / 오른쪽 정보 */}
      <div className="flex flex-1 items-center gap-3 px-4 pt-3 pb-1">
        <div className="grid shrink-0 place-items-center">
          {peace ? (
            <div className="grid h-[168px] w-[168px] place-items-center">
              <Bomb state="peace" size={140} />
            </div>
          ) : (
            <TimerRing
              progress={progress(occ, task, now)}
              state={state}
              size={168}
              vibrate={finalCountdown}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-start text-left">
          {peace ? (
            <p className="text-[13px] text-sub">평화 모드</p>
          ) : exploded ? (
            <p className="text-[17px] font-semibold" style={{ color: '#7a2f26' }}>
              {humanElapsed(occ, now)}
            </p>
          ) : (
            <p className="text-4xl font-extralight tabular-nums tracking-tight text-ink">
              {formatClock(remainingMs(occ, now))}
            </p>
          )}

          <p className="mt-1 line-clamp-2 text-[15px] font-medium text-ink">{task.content}</p>

          {(exploded || peace) && (
            <div className="mt-2.5">
              <ActionButtons
                compact
                onDone={() => markDone(occ.id)}
                onRelease={() => release(occ.id)}
                onPostpone={peace ? null : () => setPostponing(occ.id)}
              />
            </div>
          )}
        </div>
      </div>

      {/* 나머지 — 아래에 가로로 작게 */}
      {rest.length > 0 && (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto px-3 pb-2">
          {rest.slice(0, 4).map(({ occ: o, task: t }) => {
            const r = remainingMs(o, now)
            const ex = t.mode === 'bomb' && r <= 0
            return (
              <div
                key={o.id}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/75 px-2 py-1"
              >
                <Bomb
                  state={t.mode === 'peace' ? 'peace' : bombState(o, t, now)}
                  size={22}
                  vibrate={t.mode === 'bomb' && r > 0 && r <= 10000}
                />
                <span className="max-w-[80px] truncate text-[11px] text-ink">{t.content}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-sub">
                  {t.mode === 'peace'
                    ? '평화'
                    : ex
                      ? humanElapsed(o, now)
                      : formatClock(remainingMs(o, now))}
                </span>
              </div>
            )
          })}
        </div>
      )}

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
