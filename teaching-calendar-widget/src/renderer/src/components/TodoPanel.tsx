import { useState } from 'react'
import clsx from 'clsx'
import { format } from 'date-fns'
import type { TodoItem } from '@shared/types'
import { TodoModal } from './TodoModal'
import styles from './TodoPanel.module.css'

interface TodoPanelProps {
  todos: TodoItem[]
  selectedDate: string | null
  onAdd: (date: string, content: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TodoPanel({ todos, selectedDate, onAdd, onToggle, onDelete }: TodoPanelProps) {
  const [showModal, setShowModal] = useState(false)

  const pending = todos.filter(t => !t.completed)
  const done = todos.filter(t => t.completed)

  const handleAdd = (date: string, content: string) => {
    onAdd(date, content)
    setShowModal(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>📝 待办</span>
        <button className={styles.addBtn} onClick={() => setShowModal(true)}>
          + 添加
        </button>
      </div>

      {todos.length === 0 ? (
        <p className={styles.empty}>双击日期创建待办</p>
      ) : (
        <div className={styles.list}>
          {pending.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => onToggle(todo.id)}
              onDelete={() => onDelete(todo.id)}
            />
          ))}
          {done.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => onToggle(todo.id)}
              onDelete={() => onDelete(todo.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <TodoModal
          defaultDate={selectedDate || format(new Date(), 'yyyy-MM-dd')}
          onConfirm={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

function TodoItem({ todo, onToggle, onDelete }: { todo: TodoItem; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={clsx(styles.item, todo.completed && styles.done)}>
      <button className={styles.check} onClick={onToggle}>
        {todo.completed ? '✓' : '○'}
      </button>
      <span className={styles.content}>
        <span className={styles.dateTag}>{formatDate(todo.date)}</span>
        {todo.content}
      </span>
      <button className={styles.del} onClick={onDelete}>×</button>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}
