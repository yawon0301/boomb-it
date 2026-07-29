// 마감 날짜/시간 선택기 — 네이티브 <input type=date/time> 대신 <select> 사용.
//  · 삼성/안드로이드 웹뷰의 날짜·시간 피커가 깨지는(삭제·취소만 뜨는) 문제 회피.
//  · <select>는 모든 웹뷰에서 네이티브 드롭다운으로 안정적으로 동작.
import { ChevronDown } from 'lucide-react'
import { dayStr } from '../../lib/store'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const selCls =
  'w-full appearance-none rounded-2xl bg-fill px-4 py-3.5 pr-10 text-[16px] text-ink outline-none'

function Chevron() {
  return (
    <ChevronDown
      size={18}
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sub"
    />
  )
}

// value/onChange: 'YYYY-MM-DD'
export function DateSelect({ value, onChange }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const opts = []
  for (let i = 0; i <= 120; i++) {
    const d = new Date(today.getTime() + i * 86400000)
    let label = `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`
    if (i === 0) label += ' · 오늘'
    else if (i === 1) label += ' · 내일'
    opts.push({ val: dayStr(d), label })
  }
  // 현재 값이 범위 밖(지난 날짜/120일 초과)이면 맨 앞에 추가해 선택 가능하게
  if (value && !opts.some((o) => o.val === value)) {
    const [y, m, dd] = value.split('-').map(Number)
    const d = new Date(y, m - 1, dd)
    opts.unshift({ val: value, label: `${m}월 ${dd}일 (${DAYS[d.getDay()]})` })
  }
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selCls}>
        {opts.map((o) => (
          <option key={o.val} value={o.val}>
            {o.label}
          </option>
        ))}
      </select>
      <Chevron />
    </div>
  )
}

// value/onChange: 'HH:MM'
export function TimeSelect({ value, onChange }) {
  const [hh, mm] = (value || '17:00').split(':')
  const set = (a, b) => onChange(`${a}:${b}`)
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const mins = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <select value={hh} onChange={(e) => set(e.target.value, mm)} className={selCls}>
          {hours.map((h) => (
            <option key={h} value={h}>
              {h}시
            </option>
          ))}
        </select>
        <Chevron />
      </div>
      <div className="relative flex-1">
        <select value={mm} onChange={(e) => set(hh, e.target.value)} className={selCls}>
          {mins.map((m) => (
            <option key={m} value={m}>
              {m}분
            </option>
          ))}
        </select>
        <Chevron />
      </div>
    </div>
  )
}
