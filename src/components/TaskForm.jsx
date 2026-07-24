// 할 일 추가/수정 공용 폼 (기획서 A / 지침서 6)
import { useState } from 'react'
import { TIMER_OPTIONS, minutesLabel } from '../lib/options'
import { todayStr } from '../lib/store'

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex rounded-full bg-fill p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-full py-2 text-[14px] font-medium transition ${
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
      <span className="mb-1.5 block text-[13px] font-medium text-sub">{label}</span>
      {children}
    </label>
  )
}

export default function TaskForm({ initial = {}, submitLabel, onSubmit }) {
  const [content, setContent] = useState(initial.content ?? '')
  const [repeat, setRepeat] = useState(initial.repeat_rule ?? 'none')
  const [date, setDate] = useState(initial.due_date ?? todayStr())
  const [time, setTime] = useState(initial.due_time ?? '17:00')
  const [mode, setMode] = useState(initial.mode ?? 'bomb')
  const [timer, setTimer] = useState(initial.timer_minutes ?? 60)

  const inputCls =
    'w-full rounded-2xl bg-fill px-4 py-3 text-[15px] text-ink outline-none placeholder:text-sub'

  function submit(e) {
    e.preventDefault()
    if (!content.trim()) return
    onSubmit({
      content: content.trim(),
      repeat_rule: repeat,
      due_date: repeat === 'daily' ? null : date,
      due_time: time,
      mode,
      timer_minutes: mode === 'peace' ? null : timer,
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-5 px-4 py-5">
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

        <Field label="반복">
          <Segmented
            value={repeat}
            onChange={setRepeat}
            options={[
              { value: 'none', label: '한 번만' },
              { value: 'daily', label: '매일 반복' },
            ]}
          />
        </Field>

        <div className="flex gap-3">
          {repeat === 'none' && (
            <div className="flex-1">
              <Field label="마감 날짜">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          )}
          <div className="flex-1">
            <Field label="마감 시간">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </div>

        <Field label="모드">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: 'bomb', label: '💣 폭탄' },
              { value: 'peace', label: '😊 평화' },
            ]}
          />
          <span className="mt-1.5 block text-[12px] text-sub">
            {mode === 'bomb'
              ? '마감 전부터 카운트다운이 시작되고 마감 시각에 터집니다.'
              : '터지지 않습니다. 방긋 웃는 얼굴로 내내 떠 있어요.'}
          </span>
        </Field>

        {mode === 'bomb' && (
          <Field label="타이머 길이 — 마감 몇 분 전부터 등장">
            <div className="grid grid-cols-4 gap-2">
              {TIMER_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTimer(m)}
                  className={`rounded-xl py-2.5 text-[13px] font-medium transition ${
                    timer === m ? 'text-white' : 'bg-fill text-ink'
                  }`}
                  style={timer === m ? { background: 'var(--color-flame)' } : undefined}
                >
                  {minutesLabel(m)}
                </button>
              ))}
            </div>
          </Field>
        )}
      </div>

      <div
        className="sticky bottom-0 mt-auto border-t border-line bg-white px-4 py-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <button
          type="submit"
          disabled={!content.trim()}
          className="w-full rounded-full py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-30"
          style={{ background: 'var(--color-flame)' }}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
