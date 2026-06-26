import { useState, useMemo } from 'react'
import clsx from 'clsx'
import type { TimeSlot } from '@shared/types'
import { getDefaultTimeSlots } from '../parsers/scheduleParser'
import styles from './TimeSlotModal.module.css'

interface TimeSlotModalProps {
  timeSlots: TimeSlot[]
  onSave: (slots: TimeSlot[]) => void
  onClose: () => void
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

function validateTime(value: string): boolean {
  return TIME_RE.test(value)
}

export function TimeSlotModal({ timeSlots, onSave, onClose }: TimeSlotModalProps) {
  const [slots, setSlots] = useState<TimeSlot[]>(() =>
    timeSlots.length > 0 ? [...timeSlots] : getDefaultTimeSlots()
  )

  const [errors, setErrors] = useState<Record<number, string>>({})

  const updateSlot = (index: number, field: keyof TimeSlot, value: string) => {
    setSlots(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
    setErrors(prev => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  const validateAll = (): boolean => {
    const newErrors: Record<number, string> = {}
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i]
      if (!validateTime(s.startTime)) {
        newErrors[i] = newErrors[i] || `上课时间格式错误`
      }
      if (!validateTime(s.endTime)) {
        newErrors[i] = newErrors[i] || `下课时间格式错误`
      }
      if (s.startTime && s.endTime && s.startTime >= s.endTime) {
        newErrors[i] = '上课时间须早于下课时间'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateAll()) return
    const cleaned = slots.map(({ slot, startTime, endTime, label }) => ({
      slot,
      startTime,
      endTime,
      ...(label ? { label } : {})
    }))
    onSave(cleaned)
  }

  const handleAdd = () => {
    const maxSlot = slots.reduce((max, s) => Math.max(max, s.slot), 0)
    setSlots(prev => [...prev, { slot: maxSlot + 1, startTime: '08:00', endTime: '08:45' }])
  }

  const handleReset = () => {
    setSlots(getDefaultTimeSlots())
    setErrors({})
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>上课时间设置</h3>
          <button className={styles.closeBtn} onClick={onClose} title="关闭">✕</button>
        </div>

        <div className={styles.table}>
          <div className={clsx(styles.row, styles.headerRow)}>
            <span>节次</span>
            <span>上课时间</span>
            <span>下课时间</span>
            <span>标签</span>
          </div>
          {slots.map((s, i) => (
            <div className={styles.row} key={i}>
              <span className={styles.slotNum}>第{s.slot.toString().padStart(2, '0')}节</span>
              <input
                className={clsx(styles.input, errors[i] && styles.error)}
                type="text"
                value={s.startTime}
                onChange={e => updateSlot(i, 'startTime', e.target.value)}
                placeholder="HH:mm"
              />
              <input
                className={clsx(styles.input, errors[i] && styles.error)}
                type="text"
                value={s.endTime}
                onChange={e => updateSlot(i, 'endTime', e.target.value)}
                placeholder="HH:mm"
              />
              <input
                className={styles.input}
                type="text"
                value={s.label || ''}
                onChange={e => updateSlot(i, 'label', e.target.value)}
                placeholder="可选"
              />
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <div className={styles.leftActions}>
            <button className={styles.secondaryBtn} onClick={handleAdd}>+ 添加节次</button>
            <button className={styles.secondaryBtn} onClick={handleReset}>恢复默认</button>
          </div>
          <div className={styles.rightActions}>
            <button className={styles.cancelBtn} onClick={onClose}>取消</button>
            <button className={styles.confirmBtn} onClick={handleSave} disabled={hasErrors}>
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
