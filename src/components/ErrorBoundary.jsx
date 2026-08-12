// 최상위 에러 경계 — 렌더 중 예외가 나도 앱 전체가 흰 화면으로 죽지 않도록,
// 붐잇 토큰에 맞춘 안내 화면 + 에러 메시지 + 새로고침 버튼을 보여준다.
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // 콘솔에 남겨 원인 파악을 돕는다(흰 화면이면 이 스택도 안 보였음).
    console.error('[붐잇] 렌더 오류:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-dvh place-items-center bg-white px-7">
        <div className="w-full max-w-[420px] text-center">
          <h1 className="text-[18px] font-bold text-ink">문제가 발생했어요</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-sub">
            화면을 그리는 중 오류가 났습니다. 새로고침하면 대부분 해결됩니다.
          </p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-fill px-3 py-2 text-left text-[11px] text-sub">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full rounded-xl bg-ink py-2.5 text-[14px] font-medium text-white transition active:scale-[.99]"
          >
            새로고침
          </button>
        </div>
      </div>
    )
  }
}
