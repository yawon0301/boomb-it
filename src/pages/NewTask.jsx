// /new — 할 일 추가 (로그인 필요)
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTask } from '../lib/store'
import { useAuth } from '../components/AuthProvider'
import Header from '../components/Header'
import TaskForm from '../components/TaskForm'
import { maybeAskNotify } from './Checklist'

export default function NewTask() {
  const nav = useNavigate()
  const { isLoggedIn } = useAuth()

  // 메모 작성은 로그인 사용자만 — 아니면 로그인 페이지로
  useEffect(() => {
    if (!isLoggedIn) nav('/login', { replace: true })
  }, [isLoggedIn, nav])

  async function submit(data) {
    await createTask(data)
    // 첫 할 일 저장 직후에만 알림 권한을 묻는 지점 (지침서 5-3)
    maybeAskNotify()
    nav('/app')
  }

  return (
    <>
      <Header title="할 일 추가" back />
      <TaskForm submitLabel="폭탄 만들기" onSubmit={submit} />
    </>
  )
}
