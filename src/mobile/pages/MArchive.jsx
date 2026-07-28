// 모바일 기록 — 완료됨 / 미루기 / 놓아줌 (데스크톱 기록과 동일한 집계)
import { useState } from 'react'
import { Check, Clock, Wind, Trash2 } from 'lucide-react'
import { useStore } from '../../lib/hooks'
import { listByStatus, listPostponed, deleteOccurrence, deletePostponed } from '../../lib/store'
import { fmtDateTime } from '../../lib/time'

const TABS = [
  { key: 'done', label: '완료됨', icon: Check, color: '#1b7f3b' },
  { key: 'postpone', label: '미루기', icon: Clock, color: 'var(--color-flame)' },
  { key: 'release', label: '놓아줌', icon: Wind, color: 'var(--color-sub)' },
]

export default function MArchive() {
  useStore()
  const [tab, setTab] = useState('done')

  return (
    <>
      <header className="flex h-14 shrink-0 items-center px-4">
        <h1 className="text-[20px] font-extrabold tracking-tight text-ink">기록</h1>
      </header>

      <div className="grid shrink-0 grid-cols-3 gap-1 border-b border-line px-3 pb-2">
        {TABS.map(({ key, label, icon: Icon, color }) => {
          const on = tab === key
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[14px] font-semibold transition active:scale-95"
              style={{ background: on ? color : 'var(--color-fill)', color: on ? '#fff' : 'var(--color-sub)' }}
            >
              <Icon size={15} strokeWidth={2.5} />
              {label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'done' && <DoneList />}
        {tab === 'postpone' && <PostponeList />}
        {tab === 'release' && <ReleaseList />}
      </div>
    </>
  )
}

function DoneList() {
  const items = listByStatus('done')
  if (items.length === 0) return <Empty text="아직 완료한 메모가 없어요." />
  return (
    <ul className="divide-y divide-line/60">
      {items.map(({ occ, task }) => (
        <Row
          key={occ.id}
          badge="완료"
          badgeColor="#1b7f3b"
          title={task.content}
          when={fmtDateTime(occ.responded_at)}
          strike
          onDelete={() => deleteOccurrence(occ.id)}
        />
      ))}
    </ul>
  )
}

function ReleaseList() {
  const items = listByStatus('released')
  if (items.length === 0) return <Empty text="아직 놓아준 메모가 없어요." />
  return (
    <ul className="divide-y divide-line/60">
      {items.map(({ occ, task }) => (
        <Row
          key={occ.id}
          badge="놓아줌"
          badgeColor="var(--color-sub)"
          title={task.content}
          when={fmtDateTime(occ.responded_at)}
          onDelete={() => deleteOccurrence(occ.id)}
        />
      ))}
    </ul>
  )
}

function PostponeList() {
  const items = listPostponed()
  if (items.length === 0) return <Empty text="아직 미룬 메모가 없어요." />
  return (
    <ul className="divide-y divide-line/60">
      {items.map((e, i) => (
        <Row
          key={i}
          badge="미룸"
          badgeColor="var(--color-flame)"
          title={e.content || '(제목 없음)'}
          when={`${fmtDateTime(e.postponed_at)} → ${fmtDateTime(e.to)}`}
          onDelete={() => deletePostponed(i)}
        />
      ))}
    </ul>
  )
}

function Row({ badge, badgeColor, title, when, strike = false, onDelete }) {
  function handleDelete() {
    if (onDelete && confirm('이 기록을 삭제할까요?')) onDelete()
  }
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
        style={{ background: badgeColor }}
      >
        {badge}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[15px] font-medium ${strike ? 'text-sub line-through' : 'text-ink'}`}
        >
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[12px] tabular-nums text-sub">{when}</span>
      </span>
      {onDelete && (
        <button
          onClick={handleDelete}
          aria-label="기록 삭제"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sub transition active:bg-fill"
        >
          <Trash2 size={16} />
        </button>
      )}
    </li>
  )
}

function Empty({ text }) {
  return <div className="px-6 py-20 text-center text-[13px] text-sub">{text}</div>
}
