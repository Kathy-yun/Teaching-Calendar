import { useState, useCallback } from 'react'
import clsx from 'clsx'
import styles from './TeachingWeekModal.module.css'

interface TeachingWeekModalProps {
  onSave: (semester: string, startDate: string, totalWeeks: number) => void
  onClose: () => void
  defaultSemester?: string
}

export function TeachingWeekModal({ onSave, onClose, defaultSemester }: TeachingWeekModalProps) {
  const today = new Date()
  const defaultStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const [semester, setSemester] = useState(defaultSemester || '')
  const [startDate, setStartDate] = useState(defaultStart)
  const [totalWeeks, setTotalWeeks] = useState(20)

  const handleSave = useCallback(() => {
    if (!semester.trim()) {
      alert('请输入学期名称')
      return
    }
    if (!startDate) {
      alert('请选择起始日期')
      return
    }
    if (totalWeeks < 1 || totalWeeks > 52) {
      alert('周数请在 1~52 之间')
      return
    }
    onSave(semester.trim(), startDate, totalWeeks)
  }, [semester, startDate, totalWeeks, onSave])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>手动设置教学周历</h3>
          <button className={styles.closeBtn} onClick={onClose} title="关闭">✕</button>
        </div>

        <div className={styles.body}>
          <label className={styles.label}>
            <span className={styles.labelText}>学期名称</span>
            <input
              className={styles.input}
              type="text"
              value={semester}
              onChange={e => setSemester(e.target.value)}
              placeholder="如 2025-2026-1"
            />
          </label>

          <label className={styles.label}>
            <span className={styles.labelText}>第1周起始日（周一）</span>
            <input
              className={styles.input}
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </label>

          <label className={styles.label}>
            <span className={styles.labelText}>总周数</span>
            <input
              className={styles.input}
              type="number"
              min={1}
              max={52}
              value={totalWeeks}
              onChange={e => setTotalWeeks(parseInt(e.target.value) || 1)}
            />
          </label>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>取消</button>
          <button className={styles.confirmBtn} onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
