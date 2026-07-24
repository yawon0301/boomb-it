// / — 붐잇 체크리스트 (첫 화면)
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, Plus, PictureInPicture2 } from 'lucide-react'
import { useStore, useNow } from '../lib/hooks'
import {
  listPending,
  listResolvedToday,
  createTask,
  getSettings,
  setSettings,
  isLoaded,
} from '../lib/store'
import { askPermission, permissionState } from '../lib/notify'
import { unlockAudio } from '../lib/sound'
import { useFloat } from '../components/FloatProvider'
import { useAuth } from '../components/AuthProvider'
import Header from '../components/Header'
import TaskRow from '../components/TaskRow'
import BottomInput from '../components/BottomInput'

export default function Checklist() {
  useStore()
  const now = useNow(1000)
  const nav = useNavigate()
  const float = useFloat()
  const auth = useAuth()

  const pending = listPending()
  const resolved = listResolvedToday()

  // 빠른 추가 — 기본: 폭탄 모드, 1시간 뒤 마감, 타이머 30분
  async function quickAdd(content) {
    const due = new Date(Date.now() + 60 * 60000)
    const hh = String(due.getHours()).padStart(2, '0')
    const mm = String(due.getMinutes()).padStart(2, '0')
    await createTask({
      content,
      due_time: `${hh}:${mm}`,
      repeat_rule: 'none',
      mode: 'bomb',
      timer_minutes: 30,
    })
    maybeAskNotify()
  }

  return (
    <>
      <Header
        title="붐잇"
        right={
          <div className="flex items-center gap-0.5">
            <button
              onClick={float.open}
              aria-label="떠 있게 하기"
              title="떠 있게 하기"
              className="grid h-9 w-9 place-items-center rounded-full transition active:bg-fill"
              style={{ color: float.floating ? 'var(--color-flame)' : 'var(--color-ink)' }}
            >
              <PictureInPicture2 size={20} />
            </button>
            <button
              onClick={() => nav(auth.isLoggedIn ? '/new' : '/login')}
              aria-label="할 일 추가"
              className="grid h-9 w-9 place-items-center rounded-full text-ink transition active:bg-fill"
            >
              <Plus size={22} />
            </button>
            <button
              onClick={() => nav('/settings')}
              aria-label="설정"
              className="grid h-9 w-9 place-items-center rounded-full text-ink transition active:bg-fill"
            >
              <SettingsIcon size={19} />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* 떠 있게 하기 안내 배너 — 실질적 진입 관문 (지침서 5-4) */}
        {!float.floating && (
          <button
            onClick={float.open}
            className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left"
            style={{ background: 'var(--color-flame-soft)' }}
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white"
              style={{ background: 'var(--color-flame)' }}
            >
              <PictureInPicture2 size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-ink">떠 있게 하기</span>
              <span className="block text-[12px] text-sub">
                폭탄을 다른 창 위에 항상 띄워두세요
              </span>
            </span>
          </button>
        )}
        {float.error && (
          <p className="px-4 py-2 text-[12px] text-sub">{float.error}</p>
        )}

        {!isLoaded() ? (
          <div className="px-4 py-16 text-center text-[13px] text-sub">불러오는 중…</div>
        ) : pending.length === 0 && resolved.length === 0 ? (
          <Empty loggedIn={auth.isLoggedIn} />
        ) : (
          <div className="py-1">
            {pending.map(({ occ, task }) => (
              <TaskRow
                key={occ.id}
                occ={occ}
                task={task}
                now={now}
                onOpen={() => nav(`/task/${task.id}`)}
              />
            ))}

            {resolved.length > 0 && (
              <>
                <p className="px-4 pb-1 pt-4 text-[12px] font-medium text-sub">오늘 처리함</p>
                {resolved.map(({ occ, task }) => (
                  <TaskRow
                    key={occ.id}
                    occ={occ}
                    task={task}
                    now={now}
                    onOpen={() => nav(`/task/${task.id}`)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {auth.isLoggedIn ? (
        <BottomInput onSubmit={quickAdd} />
      ) : (
        <button
          onClick={() => nav('/login')}
          className="sticky bottom-0 flex items-center justify-center gap-2 border-t border-line bg-white px-4 py-3 text-[15px] font-semibold text-white"
          style={{
            background: 'var(--color-flame)',
            paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          }}
        >
          로그인하고 메모 작성하기
        </button>
      )}
    </>
  )
}

// 첫 할 일 저장 직후에만 알림 권한 요청 (지침서 5-3)
export function maybeAskNotify() {
  unlockAudio() // 저장 제스처로 오디오 잠금 해제
  const s = getSettings()
  if (!s.notifyAsked && permissionState() === 'default') {
    askPermission()
    setSettings({ notifyAsked: true })
  }
}

function Empty({ loggedIn }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-20 text-center">
      <p className="text-[15px] font-medium text-ink">아직 폭탄이 없어요</p>
      <p className="text-[13px] leading-relaxed text-sub">
        {loggedIn ? (
          <>
            아래 입력창에 할 일을 적으면
            <br />첫 폭탄이 만들어집니다.
          </>
        ) : (
          <>
            로그인하면 할 일을 적을 수 있어요.
            <br />아래 버튼으로 시작하세요.
          </>
        )}
      </p>
    </div>
  )
}
