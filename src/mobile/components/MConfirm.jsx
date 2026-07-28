// 예/아니오 확인창 — 화면 중앙 다이얼로그
export default function MConfirm({ message, yesLabel = '예', noLabel = '아니오', onYes, onNo, danger = true }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onNo}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative w-full max-w-[300px] rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-5 whitespace-pre-line text-center text-[15px] font-medium leading-relaxed text-ink">
          {message}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onNo}
            className="flex-1 rounded-full bg-fill py-3 text-[15px] font-semibold text-sub transition active:scale-95"
          >
            {noLabel}
          </button>
          <button
            onClick={onYes}
            className="flex-1 rounded-full py-3 text-[15px] font-semibold text-white transition active:scale-95"
            style={{ background: danger ? '#e5484d' : 'var(--color-flame)' }}
          >
            {yesLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
