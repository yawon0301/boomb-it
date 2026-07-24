// /new — 할 일 추가
import { useNavigate } from 'react-router-dom'
import { createTask } from '../lib/store'
import Header from '../components/Header'
import TaskForm from '../components/TaskForm'
import { maybeAskNotify } from './Checklist'

export default function NewTask() {
  const nav = useNavigate()

  function submit(data) {
    createTask(data)
    // 첫 할 일 저장 직후에만 알림 권한을 묻는 지점 (지침서 5-3)
    maybeAskNotify()
    nav('/')
  }

  return (
    <>
      <Header title="할 일 추가" back />
      <TaskForm submitLabel="폭탄 만들기" onSubmit={submit} />
    </>
  )
}
