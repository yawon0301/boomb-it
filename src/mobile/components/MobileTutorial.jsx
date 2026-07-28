// 첫 사용자 온보딩 — 짧은 3단계. 완료/건너뛰기 시 다시 안 뜸(설정에 tutorialSeen 저장).
import { useState } from 'react'
import Bomb from '../../components/Bomb'

const STEPS = [
  {
    state: 'urgent',
    title: '마감이 다가오면\n폭탄이 타들어가요',
    desc: '할 일마다 폭탄 타이머가 생기고, 마감 시각에 “펑” 터집니다.',
  },
  {
    state: 'appear',
    title: '아래에 적으면\n폭탄이 생겨요',
    desc: '맨 아래 입력창에 할 일을 적고 보내기만 누르면 끝이에요.',
  },
  {
    state: 'peace',
    title: '완료 · 미루기 · 놓아주기',
    desc: '폭탄을 눌러 완료하거나, 미루거나, 가볍게 놓아주세요.',
  },
]

export default function MobileTutorial({ onDone }) {
  const [i, setI] = useState(0)
  const last = i === STEPS.length - 1
  const step = STEPS[i]

  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[520px] flex-col bg-white">
      <div className="flex h-14 shrink-0 items-center justify-end px-4">
        <button onClick={onDone} className="text-[14px] text-sub transition active:opacity-60">
          건너뛰기
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="mb-8 grid h-40 w-40 place-items-center">
          <Bomb state={step.state} size={140} />
        </div>
        <h2 className="whitespace-pre-line text-[22px] font-bold leading-snug text-ink">
          {step.title}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-sub">{step.desc}</p>
      </div>

      <div className="shrink-0 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="mb-5 flex justify-center gap-2">
          {STEPS.map((_, idx) => (
            <span
              key={idx}
              className="h-2 rounded-full transition-all"
              style={{
                width: idx === i ? 20 : 8,
                background: idx === i ? 'var(--color-flame)' : 'var(--color-line)',
              }}
            />
          ))}
        </div>
        <button
          onClick={() => (last ? onDone() : setI(i + 1))}
          className="w-full rounded-full py-4 text-[16px] font-bold text-white transition active:scale-[0.98]"
          style={{ background: 'var(--color-flame)' }}
        >
          {last ? '시작하기' : '다음'}
        </button>
      </div>
    </div>
  )
}
