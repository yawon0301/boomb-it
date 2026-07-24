// 떠 있는 창(PiP) 상태 관리 + 포털 렌더 (지침서 5-2)
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { openFloat, floatSize, pipSupported } from '../lib/pip'
import { unlockAudio } from '../lib/sound'
import { listPending } from '../lib/store'
import { useStore } from '../lib/hooks'
import FloatContent from './FloatContent'

const FloatCtx = createContext(null)
export const useFloat = () => useContext(FloatCtx)

export default function FloatProvider({ children }) {
  useStore() // 메모 개수 변화를 구독 (창 크기 자동 조정)
  const [pipWindow, setPipWindow] = useState(null)
  const [error, setError] = useState('')
  const openingRef = useRef(false)
  const count = Math.max(1, listPending().length)

  // ⚠ 반드시 사용자 클릭 안에서 호출 (지침서 5-2)
  const open = useCallback(async () => {
    setError('')
    unlockAudio() // 클릭 제스처로 오디오 잠금 해제 (이후 폭발음 재생 보장)
    if (pipWindow) {
      pipWindow.focus?.()
      return
    }
    if (openingRef.current) return
    openingRef.current = true
    try {
      const pip = await openFloat(Math.max(1, listPending().length))
      pip.addEventListener('pagehide', () => setPipWindow(null))
      setPipWindow(pip)
    } catch (e) {
      setError(e.message || '떠 있는 창을 열 수 없습니다')
    } finally {
      openingRef.current = false
    }
  }, [pipWindow])

  // 열려 있는 동안 메모 개수가 바뀌면 창 크기를 다시 맞춤
  useEffect(() => {
    if (!pipWindow) return
    const { width, height } = floatSize(count)
    try {
      pipWindow.resizeTo(width, height)
    } catch {
      /* 브라우저가 막으면 무시 */
    }
  }, [pipWindow, count])

  const close = useCallback(() => {
    pipWindow?.close?.()
    setPipWindow(null)
  }, [pipWindow])

  // 페이지를 떠날 때 창 정리
  useEffect(() => {
    return () => pipWindow?.close?.()
  }, [pipWindow])

  return (
    <FloatCtx.Provider
      value={{ floating: !!pipWindow, open, close, supported: pipSupported(), error }}
    >
      {children}
      {pipWindow && createPortal(<FloatContent />, pipWindow.document.body)}
    </FloatCtx.Provider>
  )
}
