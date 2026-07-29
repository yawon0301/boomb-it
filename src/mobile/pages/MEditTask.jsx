// 모바일 할 일 수정 — 내용 + 마감 날짜·시간 + 모드. (타이머 길이 없음)
// 현재 마감(대기 중 occurrence의 scheduled_at)을 기준으로 값을 채워 보여준다.
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useStore } from '../../lib/hooks'
import { getTask, getState, updateTaskMobile, todayStr, dayStr } from '../../lib/store'
import { dueClock } from '../../lib/time'
import { DateSelect, TimeSelect } from '../components/MWhen'

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex rounded-full bg-fill p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-full py-2.5 text-[15px] font-medium transition ${
            value === o.value ? 'bg-white text-ink shadow-sm' : 'text-sub'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-medium text-sub">{label}</span>
      {children}
    </label>
  )
}

export default function MEditTask() {
  useStore()
  const nav = useNavigate()
  const { id } = useParams()
  const task = getTask(id)
  const occ = getState().occurrences.find(
    (o) => o.task_id === Number(id) && o.status === 'pending',
  )

  const [content, setContent] = useState(task?.content ?? '')
  const [date, setDate] = useState(() =>
    occ ? dayStr(new Date(occ.scheduled_at)) : (task?.due_date ?? todayStr()),
  )
  const [time, setTime] = useState(() => (occ ? dueClock(occ) : (task?.due_time ?? '17:00')))
  const [mode, setMode] = useState(task?.mode ?? 'bomb')
  const [saving, setSaving] = useState(false)

  const inputCls =
    'w-full rounded-2xl bg-fill px-4 py-3.5 text-[16px] text-ink outline-none placeholder:text-sub'

  function back() {
    nav('/', { replace: true })
  }

  async function submit(e) {
    e.preventDefault()
    if (!content.trim() || saving) return
    setSaving(true)
    await updateTaskMobile(Number(id), {
      content: content.trim(),
      due_date: date,
      due_time: time,
      mode,
    })
    back()
  }

  return (
    <form onSubmit={submit} className="mx-auto flex h-dvh w-full max-w-[520px] flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center px-3">
        <button
          type="button"
          onClick={back}
          aria-label="뒤로"
          className="grid h-10 w-10 place-items-center rounded-full text-ink transition active:bg-fill"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="ml-1 text-[18px] font-bold text-ink">할 일 수정</h1>
      </header>

      {!task ? (
        <div className="grid flex-1 place-items-center px-6 text-center text-[14px] text-sub">
          없는 할 일이에요.
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
            <Field label="할 일">
              <input
                autoFocus
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="예: 전공수업 과제 제출"
                maxLength={500}
                className={inputCls}
              />
            </Field>

            <Field label="마감 날짜">
              <DateSelect value={date} onChange={setDate} />
            </Field>
            <Field label="마감 시간">
              <TimeSelect value={time} onChange={setTime} />
            </Field>

            <Field label="모드">
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'bomb', label: '💣 폭탄' },
                  { value: 'peace', label: '😊 평화' },
                ]}
              />
              <span className="mt-2 block text-[13px] leading-relaxed text-sub">
                {mode === 'bomb'
                  ? '만든 순간부터 마감까지 폭탄이 타들어가고, 마감 시각에 터집니다.'
                  : '터지지 않습니다. 방긋 웃는 얼굴로 내내 떠 있어요.'}
              </span>
            </Field>
          </div>

          <div
            className="shrink-0 border-t border-line bg-white px-4 py-3"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
          >
            <button
              type="submit"
              disabled={!content.trim() || saving}
              className="w-full rounded-full py-4 text-[16px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-30"
              style={{ background: 'var(--color-flame)' }}
            >
              저장하기
            </button>
          </div>
        </>
      )}
    </form>
  )
}
