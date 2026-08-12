// /admin — 관리자 대시보드
//  · 관리자(ADMIN_USER_ID)만 접근. 그 외에는 메인(/)으로 돌려보냄.
//  · 숫자 위주, 붐잇 토큰/폰트 그대로. 장식 없음.
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../components/AuthProvider'
import {
  fetchAdminDashboard,
  fetchAdminUsers,
  fetchAdminFunnel,
  fetchAdminTossScreens,
} from '../lib/admin'
import { fmtDateTime } from '../lib/time'
import Header from '../components/Header'

const PAGE = 10 // 더보기 한 번에 가져올 인원
const FUNNEL_STAGES = [
  { key: 'visited', label: '1. 사이트 방문' },
  { key: 'task', label: '2. 할 일 1개+ 등록' },
  { key: 'pip', label: '3. 폭탄 창(PiP) 띄움' },
  { key: 'boom', label: '4. 폭발 도달 (미루기·삭제 없이)' },
  { key: 'done', label: '5. 완료 누름' },
  { key: 'second', label: '6. 두 번째 할 일 등록' },
]
const STATUS_LABEL = { pending: '대기', done: '완료', released: '놓아줌' }
const PROVIDER_LABEL = { kakao: '카카오', anonymous: '익명', email: '이메일' }
const nfmt = (n) => Number(n ?? 0).toLocaleString('ko-KR')
const shortId = (id) => (id ? '…' + String(id).split('-').pop() : '—')

export default function Admin() {
  const auth = useAuth()
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!auth.isAdmin) return
    fetchAdminDashboard()
      .then(setData)
      .catch((e) => setErr(e?.message || '불러오지 못했습니다.'))
  }, [auth.isAdmin])

  if (!auth.ready) return null // 인증 판정 전 — 깜빡임 방지
  if (!auth.isAdmin) return <Navigate to="/" replace /> // 관리자 외 차단

  return (
    <>
      <Header title="관리자" back />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {err && (
          <p className="rounded-xl bg-fill px-3 py-2 text-[13px] text-sub">{err}</p>
        )}
        {!data && !err && (
          <p className="py-16 text-center text-[13px] text-sub">불러오는 중…</p>
        )}
        {data && <Dashboard d={data} />}
        <p className="mt-8 break-all text-[11px] text-sub">
          현재 로그인 UID: {auth.userId}
        </p>
      </div>
    </>
  )
}

function Dashboard({ d }) {
  const done = d.done_count ?? 0
  const released = d.released_count ?? 0
  const postpone = d.postpone_count ?? 0
  const actions = done + released + postpone
  const pct = (n) => (actions ? Math.round((n / actions) * 100) : 0)

  const realCount = d.real_users ?? 0
  const anonCount = Math.max(0, (d.total_users ?? 0) - realCount)

  return (
    <div className="space-y-6">
      {/* 가입/할 일 규모 */}
      <section className="grid grid-cols-2 gap-2">
        <Tile
          label="실 가입자"
          value={nfmt(realCount)}
          sub="카카오 로그인"
          accent="var(--color-flame)"
        />
        <Tile label="전체 가입자" value={nfmt(d.total_users)} sub="익명 방문 포함" />
        <Tile label="최근 7일 신규" value={nfmt(d.new_users_7d)} sub="익명 제외" />
        <Tile label="전체 할 일" value={nfmt(d.total_tasks)} />
      </section>

      {/* 상태별 횟수·비율 */}
      <section>
        <h2 className="mb-2 text-[13px] font-semibold text-sub">상태별 (완료·놓아줌·미루기)</h2>
        <div className="grid grid-cols-3 gap-2">
          <Tile label="완료" value={nfmt(done)} sub={`${pct(done)}%`} accent="#1b7f3b" />
          <Tile label="놓아줌" value={nfmt(released)} sub={`${pct(released)}%`} />
          <Tile
            label="미루기"
            value={nfmt(postpone)}
            sub={`${pct(postpone)}%`}
            accent="var(--color-flame)"
          />
        </div>
      </section>

      {/* 전환 깔때기 */}
      <Funnel />

      {/* 토스앱 익명 방문자 화면 도달 깔때기 */}
      <TossScreens />

      {/* 가입 사용자 명단 (익명 제외) */}
      <UserTable kind="real" title="가입 사용자" total={realCount} />

      {/* 익명 사용자 명단 */}
      <UserTable kind="anon" title="익명 사용자" total={anonCount} />

      {/* 최근 등록 20개 */}
      <section>
        <h2 className="mb-2 text-[13px] font-semibold text-sub">최근 등록된 할 일 20개</h2>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-sub">
                <th className="px-3 py-2 font-medium">내용</th>
                <th className="px-3 py-2 font-medium">등록시각</th>
                <th className="px-3 py-2 font-medium">마감시각</th>
                <th className="px-3 py-2 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {(d.recent_tasks ?? []).map((t, i) => (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  <td className="max-w-[40vw] truncate px-3 py-2 text-ink">{t.content}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-sub">
                    {fmtDateTime(t.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-sub">
                    {t.due_at ? fmtDateTime(t.due_at) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink">
                    {STATUS_LABEL[t.status] ?? t.status}
                  </td>
                </tr>
              ))}
              {(d.recent_tasks ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-sub">
                    등록된 할 일이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// 사용자 명단 — 더보기 누를 때마다 서버에서 다음 PAGE명을 추가로 fetch
function UserTable({ kind, title, total }) {
  const isAnon = kind === 'anon'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function loadMore(offset) {
    setLoading(true)
    setErr('')
    try {
      const page = await fetchAdminUsers(isAnon, offset, PAGE)
      setRows((prev) => [...prev, ...page])
    } catch (e) {
      setErr(e?.message || '명단을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMore(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasMore = rows.length < total
  const remaining = Math.max(0, total - rows.length)

  return (
    <section>
      <h2 className="mb-2 text-[13px] font-semibold text-sub">
        {title} ({nfmt(total)}명)
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-sub">
              {isAnon ? (
                <>
                  <th className="px-3 py-2 font-medium">임시 ID</th>
                  <th className="px-3 py-2 font-medium">처음 접속</th>
                  <th className="px-3 py-2 font-medium">최근 접속</th>
                </>
              ) : (
                <>
                  <th className="px-3 py-2 font-medium">닉네임 / 이메일</th>
                  <th className="px-3 py-2 font-medium">수단</th>
                  <th className="px-3 py-2 font-medium">가입일</th>
                  <th className="px-3 py-2 font-medium">최근 로그인</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) =>
              isAnon ? (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  <td className="whitespace-nowrap px-3 py-2 font-mono tabular-nums text-ink">
                    {shortId(u.id)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-sub">
                    {fmtDateTime(u.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-sub">
                    {u.last_sign_in_at ? fmtDateTime(u.last_sign_in_at) : '—'}
                  </td>
                </tr>
              ) : (
                <tr key={i} className="border-b border-line/60 last:border-0">
                  <td className="max-w-[40vw] truncate px-3 py-2 text-ink">
                    {u.nickname || u.email || '(이름 없음)'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-sub">
                    {PROVIDER_LABEL[u.provider] ?? u.provider}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-sub">
                    {fmtDateTime(u.created_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-sub">
                    {u.last_sign_in_at ? fmtDateTime(u.last_sign_in_at) : '—'}
                  </td>
                </tr>
              ),
            )}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={isAnon ? 3 : 4} className="px-3 py-8 text-center text-sub">
                  {isAnon ? '익명 사용자가 없습니다.' : '가입 사용자가 없습니다.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {err && <p className="mt-2 text-[12px] text-sub">{err}</p>}

      {hasMore && (
        <button
          onClick={() => loadMore(rows.length)}
          disabled={loading}
          className="mt-2 w-full rounded-xl border border-line bg-fill py-2 text-[13px] font-medium text-sub transition active:scale-[.99] disabled:opacity-60"
        >
          {loading ? '불러오는 중…' : `더보기 (남은 ${nfmt(remaining)}명)`}
        </button>
      )}
    </section>
  )
}

// 열(가입/익명)별 인원·전환율 + 가장 크게 떨어지는 단계 인덱스
function colStats(col) {
  const counts = FUNNEL_STAGES.map((s) => col?.[s.key] ?? 0)
  const conv = counts.map((c, i) => (i === 0 ? null : counts[i - 1] ? c / counts[i - 1] : null))
  let worstIdx = -1
  let worstVal = Infinity
  conv.forEach((v, i) => {
    if (v !== null && v < worstVal) {
      worstVal = v
      worstIdx = i
    }
  })
  return { counts, conv, worstIdx }
}

function FunnelCell({ count, conv, worst }) {
  return (
    <td className="px-3 py-2 text-right align-top">
      <div className="text-[16px] font-bold tabular-nums text-ink">{nfmt(count)}</div>
      <div
        className="text-[12px] tabular-nums"
        style={{
          color: worst ? 'var(--color-flame)' : 'var(--color-sub)',
          fontWeight: worst ? 700 : 400,
        }}
      >
        {conv === null ? '—' : `${Math.round(conv * 100)}%${worst ? ' ↓' : ''}`}
      </div>
    </td>
  )
}

// 전환 깔때기 — 단계별 사람 수 + 바로 앞 단계 대비 전환율(가입/익명 열 분리)
function Funnel() {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetchAdminFunnel()
      .then(setD)
      .catch((e) => setErr(e?.message || '깔때기를 불러오지 못했습니다.'))
  }, [])

  const real = colStats(d?.real)
  const anon = colStats(d?.anon)

  return (
    <section>
      <h2 className="mb-2 text-[13px] font-semibold text-sub">전환 깔때기 (사람 수 · 앞 단계 대비 %)</h2>
      {err ? (
        <p className="rounded-xl bg-fill px-3 py-2 text-[13px] text-sub">{err}</p>
      ) : !d ? (
        <p className="py-8 text-center text-[13px] text-sub">불러오는 중…</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line text-sub">
                  <th className="px-3 py-2 text-left font-medium">단계</th>
                  <th className="px-3 py-2 text-right font-medium">가입 사용자</th>
                  <th className="px-3 py-2 text-right font-medium">익명 사용자</th>
                </tr>
              </thead>
              <tbody>
                {FUNNEL_STAGES.map((s, i) => (
                  <tr key={s.key} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-2 align-top text-ink">{s.label}</td>
                    <FunnelCell count={real.counts[i]} conv={real.conv[i]} worst={real.worstIdx === i} />
                    <FunnelCell count={anon.counts[i]} conv={anon.conv[i]} worst={anon.worstIdx === i} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-sub">
            · 인원은 사람 수(distinct 사용자). 한 사람이 할 일을 여러 개 등록해도 1명.
            <br />· 전환율은 바로 앞 단계 대비. 가장 크게 떨어지는 단계는 <span style={{ color: 'var(--color-flame)' }}>주황색 ↓</span>.
            <br />· 3단계(PiP)는 이 기능 배포 이후부터 집계됩니다(과거분 0). 4단계는 예정시각 경과로 추론합니다.
          </p>
        </>
      )}
    </section>
  )
}

// 토스앱 익명 방문자가 각 화면까지 도달한 인원(앱 진입 대비 %). 도달률이 낮은 화면 = 이탈 지점.
const TOSS_SCREENS = [
  { key: 'home', label: '홈' },
  { key: 'new', label: '새 할 일 작성' },
  { key: 'detail', label: '할 일 상세' },
  { key: 'edit', label: '할 일 편집' },
  { key: 'stats', label: '통계' },
  { key: 'archive', label: '기록' },
  { key: 'settings', label: '설정' },
]

function TossScreens() {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetchAdminTossScreens()
      .then(setD)
      .catch((e) => setErr(e?.message || '불러오지 못했습니다.'))
  }, [])

  const entered = d?.entered ?? 0
  const pct = (n) => (entered ? Math.round((n / entered) * 100) : 0)

  return (
    <section>
      <h2 className="mb-2 text-[13px] font-semibold text-sub">
        토스앱 익명 방문자 — 화면 도달 (앱 진입 대비 %)
      </h2>
      {err ? (
        <p className="rounded-xl bg-fill px-3 py-2 text-[13px] text-sub">{err}</p>
      ) : !d ? (
        <p className="py-8 text-center text-[13px] text-sub">불러오는 중…</p>
      ) : entered === 0 ? (
        <p className="rounded-xl bg-fill px-3 py-2 text-[13px] text-sub">
          아직 토스앱 방문 데이터가 없습니다. (이 기능 배포 이후부터 집계됩니다)
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-sub">
                <th className="px-3 py-2 font-medium">화면</th>
                <th className="px-3 py-2 text-right font-medium">도달 인원</th>
                <th className="px-3 py-2 text-right font-medium">진입 대비</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line/60">
                <td className="px-3 py-2 font-medium text-ink">앱 진입</td>
                <td className="px-3 py-2 text-right font-bold tabular-nums text-ink">
                  {nfmt(entered)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-sub">100%</td>
              </tr>
              {TOSS_SCREENS.map((s) => {
                const c = d[s.key] ?? 0
                return (
                  <tr key={s.key} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-2 text-ink">{s.label}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums text-ink">
                      {nfmt(c)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-sub">{pct(c)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-sub">
        · 인원은 사람 수(distinct). 한 방문자가 같은 화면을 여러 번 봐도 1명.
        <br />· 도달률이 낮은 화면 = 방문자가 거기까지 가기 전에 앱을 떠난 지점.
        <br />· 이 기능 배포 이후 방문분만 집계됩니다(과거분 없음).
      </p>
    </section>
  )
}

function Tile({ label, value, sub, accent }) {
  return (
    <div className="rounded-2xl border border-line bg-white px-3 py-3">
      <div className="text-[12px] text-sub">{label}</div>
      <div
        className="mt-1 text-[24px] font-bold leading-none tabular-nums"
        style={{ color: accent || 'var(--color-ink)' }}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[12px] tabular-nums text-sub">{sub}</div>}
    </div>
  )
}
