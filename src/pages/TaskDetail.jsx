// /task/:id — 상세 · 수정 · 삭제
import { useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { getTask, updateTask, deleteTask } from '../lib/store'
import { useStore } from '../lib/hooks'
import Header from '../components/Header'
import TaskForm from '../components/TaskForm'

export default function TaskDetail() {
  useStore()
  const { id } = useParams()
  const nav = useNavigate()
  const task = getTask(id)

  if (!task) {
    return (
      <>
        <Header title="상세" back />
        <div className="grid flex-1 place-items-center text-[14px] text-sub">
          없는 할 일입니다.
        </div>
      </>
    )
  }

  function submit(data) {
    updateTask(task.id, data)
    nav('/')
  }

  function remove() {
    if (confirm('이 할 일을 완전히 삭제할까요?')) {
      deleteTask(task.id)
      nav('/')
    }
  }

  return (
    <>
      <Header
        title="할 일 수정"
        back
        right={
          <button
            onClick={remove}
            aria-label="삭제"
            className="grid h-9 w-9 place-items-center rounded-full text-sub transition active:bg-fill"
          >
            <Trash2 size={18} />
          </button>
        }
      />
      <TaskForm initial={task} submitLabel="저장" onSubmit={submit} />
    </>
  )
}
