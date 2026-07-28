// 모바일 하단 입력창 — 글씨 16px(그 미만이면 iOS가 포커스 시 자동 확대되므로).
import { useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function MBottomInput({ onSubmit }) {
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
      className="flex shrink-0 items-center gap-2 border-t border-line bg-white px-3 py-2.5"
      style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))' }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="할 일을 적어보세요…"
        className="h-11 flex-1 rounded-full bg-fill px-4 text-[16px] text-ink outline-none placeholder:text-sub"
      />
      <button
        type="submit"
        aria-label="추가"
        // 입력칸의 포커스를 뺏지 않게(=키보드 유지) → 한 번 탭으로 바로 전송(카톡처럼).
        // 이게 없으면 첫 탭이 blur만 시키고 레이아웃이 흔들려 클릭이 씹힘.
        onMouseDown={(e) => e.preventDefault()}
        disabled={!text.trim()}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white transition active:scale-95 disabled:opacity-30"
        style={{ background: 'var(--color-flame)' }}
      >
        <ArrowUp size={20} strokeWidth={2.5} />
      </button>
    </form>
  )
}
