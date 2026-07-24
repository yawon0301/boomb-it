// 우측 날개 — 메모(할 일) 통계 배너 블럭 (PC 전용)
import { Flame, CheckCircle2, AlarmClock, Smile, Timer, TrendingUp } from 'lucide-react'
import { useStore, useNow } from '../lib/hooks'
import { computeStats } from '../lib/stats'
import { humanDur } from '../lib/time'

function Block({ icon, label, value, sub, tone = 'ink' }) {
  const color =
    tone === 'flame' ? 'var(--color-flame)' : tone === 'ink' ? 'var(--color-ink)' : 'var(--color-sub)'
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line/60">
      <div className="mb-2 flex items-center gap-2 text-sub">
        <span style={{ color }}>{icon}</span>
        <span className="text-[12px] font-medium">{label}</span>
      </div>
      <p className="text-[22px] font-bold leading-none tabular-nums" style={{ color }}>
        {value}
      </p>
      {sub && <p className="mt-1.5 text-[11px] text-sub">{sub}</p>}
    </div>
  )
}

export default function StatsWing() {
  useStore()
  useNow(1000)
  const s = computeStats()

  return (
    <aside className="flex w-full flex-col gap-3">
      <p className="px-1 text-[12px] font-semibold tracking-wide text-sub">한눈에 보기</p>

      <div className="grid grid-cols-2 gap-3">
        <Block
          icon={<Flame size={16} />}
          label="타는 중"
          value={s.activeBombs}
          sub="지금 카운트다운 중"
          tone="flame"
        />
        <Block
          icon={<AlarmClock size={16} />}
          label="방치됨"
          value={s.neglected}
          sub="터진 채 미응답"
          tone={s.neglected > 0 ? 'flame' : 'sub'}
        />
        <Block
          icon={<CheckCircle2 size={16} />}
          label="오늘 완료"
          value={s.doneToday}
          sub={`이번 주 ${s.doneWeek}건`}
        />
        <Block
          icon={<Smile size={16} />}
          label="평화 모드"
          value={s.peace}
          sub="웃으며 상주 중"
        />
      </div>

      <Block
        icon={<TrendingUp size={16} />}
        label="이번 주 완료율"
        value={s.completionRate == null ? '—' : `${s.completionRate}%`}
        sub={
          s.completionRate == null
            ? '아직 처리한 항목이 없어요'
            : `완료 ${s.doneWeek} · 놓아줌 ${s.releasedWeek}`
        }
      />

      <Block
        icon={<Timer size={16} />}
        label="다음 폭발까지"
        value={s.nextBombMs == null ? '없음' : humanDur(s.nextBombMs)}
        sub={s.nextBombMs == null ? '예정된 폭탄이 없어요' : '가장 임박한 폭탄'}
        tone={s.nextBombMs != null ? 'flame' : 'sub'}
      />
    </aside>
  )
}
