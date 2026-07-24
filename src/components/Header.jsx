import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function Header({ title, back = false, right = null }) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-1 border-b border-line bg-white/90 px-3 backdrop-blur">
      {back ? (
        <button
          onClick={() => nav(-1)}
          aria-label="뒤로"
          className="grid h-9 w-9 place-items-center rounded-full text-ink transition active:bg-fill"
        >
          <ChevronLeft size={22} />
        </button>
      ) : (
        <span className="w-1" />
      )}
      <h1 className="flex-1 truncate px-1 text-[17px] font-bold text-ink">{title}</h1>
      {right}
    </header>
  )
}
