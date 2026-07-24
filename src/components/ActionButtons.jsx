// 완료 / 미루기 / 놓아주기 (지침서 3-3 버튼 색)

export default function ActionButtons({
  onDone,
  onPostpone,
  onRelease,
  compact = false,
  size = 'md',
}) {
  const sizeCls = size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-11 px-5 text-[15px]'
  const base = `rounded-full font-medium transition active:scale-95 whitespace-nowrap ${sizeCls}`
  return (
    <div className={`flex items-center justify-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
      <button
        type="button"
        onClick={onDone}
        className={base}
        style={{ background: '#e3f5e9', color: '#1b7f3b' }}
      >
        완료
      </button>
      {onPostpone && (
        <button
          type="button"
          onClick={onPostpone}
          className={base}
          style={{ background: 'var(--color-flame-soft)', color: 'var(--color-flame)' }}
        >
          미루기
        </button>
      )}
      <button
        type="button"
        onClick={onRelease}
        className={base}
        style={{ background: 'var(--color-fill)', color: 'var(--color-sub)' }}
      >
        놓아주기
      </button>
    </div>
  )
}
