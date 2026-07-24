// 좌측 날개 — 사이트 소개 (PC 전용, 모바일에선 숨김)
import Bomb from './Bomb'

const PRINCIPLES = [
  ['찾아가는 알림', '앱을 열지 않아도 화면에 폭탄이 떠 있습니다.'],
  ['볼 때마다 다르게', '색이 변하고 심지가 타들어가 눈을 다시 잡습니다.'],
  ['소멸이 미덕', '끝난 일은 놓아주기로 가볍게 비웁니다.'],
]

export default function IntroWing() {
  return (
    <aside className="flex w-full flex-col gap-4">
      <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-line/60">
        <div className="mb-3 flex items-center gap-2">
          <Bomb state="urgent" size={40} />
          <div>
            <p className="text-[17px] font-bold leading-none text-ink">붐잇</p>
            <p className="mt-1 text-[11px] tracking-wide text-sub">boomb-it</p>
          </div>
        </div>
        <p className="text-[13px] leading-relaxed text-ink">
          마감이 다가오면 화면 위에서 <b>폭탄이 타들어가는</b> 할 일 웹.
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-sub">
          찾아보지 않아도 눈앞에 있습니다. 그리고 볼 때마다 표정이 다릅니다.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {PRINCIPLES.map(([t, d]) => (
          <div key={t} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line/60">
            <p className="text-[13px] font-semibold text-ink">{t}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-sub">{d}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-flame-soft p-4">
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-flame)' }}>
          평화 모드로 두면 폭탄이 방긋 웃는 얼굴로 조용히 상주합니다.
        </p>
      </div>
    </aside>
  )
}
