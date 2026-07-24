// 하단 할 일 입력창 — 완전 라운드 + 불꽃 오렌지 전송 (지침서 3-2)
import { useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BottomInput({ onSubmit }) {
  const [text, setText] = useState('')

  function submit(e) {
    e.preventDefault()
    const v = text.trim()
    if (!v) return
    onSubmit(v)
    setText('')
  }

  return (
    <form
      onSubmit={submit}
      className="sticky bottom-0 flex items-center gap-2 border-t border-line bg-white px-3 py-2.5"
      style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="할 일을 적어보세요…"
        className="h-11 flex-1 rounded-full bg-fill px-4 text-[15px] text-ink outline-none placeholder:text-sub"
      />
      <button
        type="submit"
        aria-label="추가"
        disabled={!text.trim()}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition active:scale-95 disabled:opacity-30"
        style={{ background: 'var(--color-flame)' }}
      >
        <ArrowUp size={20} strokeWidth={2.5} />
      </button>
    </form>
  )
}
