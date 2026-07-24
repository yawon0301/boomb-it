// 반응형 셸 — 모바일 센터 기본, PC에서 좌(소개)·우(통계) 날개
import { Outlet } from 'react-router-dom'
import IntroWing from './IntroWing'
import StatsWing from './StatsWing'

export default function Shell() {
  return (
    <div className="min-h-dvh w-full lg:px-6 lg:py-7">
      <div className="mx-auto flex w-full max-w-[1180px] items-start justify-center gap-5 xl:gap-8">
        {/* 좌측 날개 — 사이트 소개 (약간 뒤로 물러난 느낌) */}
        <div className="hidden w-52 shrink-0 pt-10 lg:block xl:w-64">
          <div className="sticky top-7 opacity-95">
            <IntroWing />
          </div>
        </div>

        {/* 센터 — 모바일 앱 프레임 */}
        <main className="relative flex h-dvh w-full max-w-[480px] shrink-0 flex-col overflow-hidden bg-white lg:h-[86vh] lg:rounded-[28px] lg:shadow-xl lg:ring-1 lg:ring-line/50">
          <Outlet />
        </main>

        {/* 우측 날개 — 메모 통계 배너 블럭 */}
        <div className="hidden w-56 shrink-0 pt-10 lg:block xl:w-72">
          <div className="sticky top-7">
            <StatsWing />
          </div>
        </div>
      </div>
    </div>
  )
}
