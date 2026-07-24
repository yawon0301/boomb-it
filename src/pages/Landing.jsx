// / — 첫 페이지(랜딩). 메모 아이콘 + 제목 + 서브 설명 + 하단 "시작하기"
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NotebookPen } from 'lucide-react'
import Bomb from '../components/Bomb'
import BombBoom from '../components/BombBoom'
import { unlockAudio } from '../lib/sound'
import { useAuth } from '../components/AuthProvider'

export default function Landing() {
  const nav = useNavigate()
  const { isLoggedIn } = useAuth()
  const [booming, setBooming] = useState(false) // 시작하기 → 폭발 전환 중

  // 이미 로그인돼 있으면(카카오 리다이렉트 복귀 포함) 바로 앱으로
  useEffect(() => {
    if (isLoggedIn) nav('/app', { replace: true })
  }, [isLoggedIn, nav])

  // 시작하기: 폭탄이 터지는 연출 뒤 앱으로 진입
  function start() {
    if (booming) return
    unlockAudio() // 클릭 제스처에서 오디오 잠금 해제
    setBooming(true)
  }

  return (
    <div className="grid min-h-dvh place-items-center lg:py-8">
      <main className="relative flex h-dvh w-full max-w-[480px] flex-col bg-white px-7 lg:h-[86vh] lg:rounded-[28px] lg:shadow-xl lg:ring-1 lg:ring-line/50">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {/* 메모 관련 아이콘 (+ 폭탄 악센트) */}
          <div
            className="relative mb-7 grid h-24 w-24 place-items-center rounded-[28px]"
            style={{ background: 'var(--color-flame-soft)' }}
          >
            <NotebookPen size={44} style={{ color: 'var(--color-flame)' }} />
            <span className="absolute -bottom-3 -right-3">
              <Bomb state="urgent" size={46} />
            </span>
          </div>

          <h1 className="text-[30px] font-extrabold tracking-tight text-ink">붐잇</h1>
          <p className="mt-2 text-[15px] font-semibold text-ink">
            마감이 다가오면 폭탄이 타들어가는 할 일 메모
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-sub">
            찾아보지 않아도 눈앞에 떠 있고,
            <br />
            볼 때마다 표정이 다릅니다.
            <br />
            끝난 일은 가볍게 놓아주세요.
          </p>
        </div>

        <div className="pb-[calc(1.75rem+env(safe-area-inset-bottom))] pt-2">
          <button
            onClick={start}
            disabled={booming}
            className="w-full rounded-full py-4 text-[16px] font-bold text-white transition active:scale-[0.98] disabled:opacity-70"
            style={{ background: 'var(--color-flame)' }}
          >
            시작하기
          </button>
        </div>
      </main>

      {booming && <BombBoom onDone={() => nav('/app')} />}
    </div>
  )
}
