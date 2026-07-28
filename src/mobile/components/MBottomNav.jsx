// 모바일 하단 탭 — 홈 / 통계 / 기록 / 설정
import { NavLink } from 'react-router-dom'
import { Home, BarChart3, ClipboardList, Settings } from 'lucide-react'

const TABS = [
  { to: '/', label: '홈', icon: Home, end: true },
  { to: '/stats', label: '통계', icon: BarChart3 },
  { to: '/archive', label: '기록', icon: ClipboardList },
  { to: '/settings', label: '설정', icon: Settings },
]

export default function MBottomNav() {
  return (
    <nav
      className="grid shrink-0 grid-cols-4 border-t border-line bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="flex flex-col items-center justify-center gap-1 py-2.5"
        >
          {({ isActive }) => (
            <>
              <Icon
                size={22}
                style={{ color: isActive ? 'var(--color-flame)' : 'var(--color-sub)' }}
              />
              <span
                className="text-[11px] font-medium"
                style={{ color: isActive ? 'var(--color-flame)' : 'var(--color-sub)' }}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
