import { useState } from 'react'
import clsx from 'clsx'
import styles from './TodoModal.module.css'

interface TodoModalProps {
  defaultDate: string
  onConfirm: (date: string, content: string) => void
  onClose: () => void
}

export function TodoModal({ defaultDate, onConfirm, onClose }: TodoModalProps) {
  const [date, setDate] = useState(defaultDate)
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    onConfirm(date, content.trim())
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.title}>添加待办</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>日期</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>内容</label>
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="输入待办内容..."
              className={styles.input}
              autoFocus
            />
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>取消</button>
            <button type="submit" className={styles.confirmBtn} disabled={!content.trim()}>
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
