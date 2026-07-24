// /login — 로그인 페이지. 회원가입 아이콘 + "3초만에 카카오로그인"
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, UserPlus, MessageSquare } from 'lucide-react'
import { useAuth } from '../components/AuthProvider'

export default function Login() {
  const nav = useNavigate()
  const { isLoggedIn, loginKakao } = useAuth()

  useEffect(() => {
    if (isLoggedIn) nav('/app', { replace: true })
  }, [isLoggedIn, nav])

  return (
    <div className="grid min-h-dvh place-items-center lg:py-8">
      <main className="relative flex h-dvh w-full max-w-[480px] flex-col bg-white lg:h-[86vh] lg:rounded-[28px] lg:shadow-xl lg:ring-1 lg:ring-line/50">
        <header className="flex h-14 shrink-0 items-center px-3">
          <button
            onClick={() => nav('/')}
            aria-label="뒤로"
            className="grid h-9 w-9 place-items-center rounded-full text-ink transition active:bg-fill"
          >
            <ChevronLeft size={22} />
          </button>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <div
            className="mb-5 grid h-20 w-20 place-items-center rounded-[24px]"
            style={{ background: 'var(--color-flame-soft)' }}
          >
            <UserPlus size={38} style={{ color: 'var(--color-flame)' }} />
          </div>
          <h1 className="text-[22px] font-bold text-ink">로그인하고 시작하기</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-sub">
            메모 작성은 로그인한 사용자만 이용할 수 있어요.
            <br />
            카카오로 3초 만에 시작하세요.
          </p>
        </div>

        <div className="px-7 pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <button
            onClick={loginKakao}
            className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-[16px] font-bold transition active:scale-[0.98]"
            style={{ background: '#FEE500', color: '#191600' }}
          >
            <MessageSquare size={19} fill="#191600" strokeWidth={0} /> 3초만에 카카오로그인
          </button>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-sub">
            <UserPlus size={15} />
            <span className="text-[12px]">처음이세요? 카카오로 로그인하면 자동으로 회원가입돼요</span>
          </div>
        </div>
      </main>
    </div>
  )
}
