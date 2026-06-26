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

const TIME_RE = /^([0-9]|0\d|1\d|2[0-3]):[0-5]\d$/

function validateTime(value: string): boolean {
  return TIME_RE.test(value)
}

// 时间字符串转分钟数，避免 "9:45" >= "10:30" 这类字符串比较bug
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function TimeSlotModal({ timeSlots, onSave, onClose }: TimeSlotModalProps) {
  const [slots, setSlots] = useState<TimeSlot[]>(() =>
    timeSlots.length > 0 ? [...timeSlots] : getDefaultTimeSlots()
  )
  const [saved, setSaved] = useState(false)

  // 全表扫描，检测时间矛盾并返回按字段标记的错误信息
  const scanConflicts = useMemo((): Record<number, { start?: string; end?: string }> => {
    const errors: Record<number, { start?: string; end?: string }> = {}

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i]

      // 格式校验
      if (s.startTime && !validateTime(s.startTime)) {
        errors[i] = errors[i] || {}
        errors[i]!.start = '格式错误'
      }
      if (s.endTime && !validateTime(s.endTime)) {
        errors[i] = errors[i] || {}
        errors[i]!.end = '格式错误'
      }

      // 本行内：上课 >= 下课
      if (s.startTime && s.endTime && toMinutes(s.startTime) >= toMinutes(s.endTime)) {
        errors[i] = errors[i] || {}
        errors[i]!.start = '须早于下课时间'
      }
    }

    // 相邻行：下课时间 > 下一行上课时间 = 重叠
    for (let i = 0; i < slots.length - 1; i++) {
      const currEnd = slots[i].endTime
      const nextStart = slots[i + 1].startTime

      if (currEnd && nextStart && toMinutes(currEnd) > toMinutes(nextStart)) {
        const nextSlot = slots[i + 1].slot
        const currSlot = slots[i].slot

        errors[i] = errors[i] || {}
        errors[i]!.end = `下课 ${currEnd} 与第${nextSlot}节上课 ${nextStart} 重叠`

        errors[i + 1] = errors[i + 1] || {}
        errors[i + 1]!.start = `上课 ${nextStart} 与第${currSlot}节下课 ${currEnd} 重叠`
      }
    }

    return errors
  }, [slots])

  const errors = scanConflicts
  const hasErrors = Object.values(errors).some(e => e.start || e.end)

  const updateSlot = (index: number, field: keyof TimeSlot, value: string) => {
    setSlots(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleSave = () => {
    if (hasErrors) {
      alert('请检查标红的时段，确保所有时间无重叠且格式正确')
      return
    }
    const cleaned = slots.map(({ slot, startTime, endTime, label }) => ({
      slot,
      startTime,
      endTime,
      ...(label ? { label } : {})
    }))
    onSave(cleaned)
    setSaved(true)
    setTimeout(onClose, 600)
  }

  const handleAdd = () => {
    const maxSlot = slots.reduce((max, s) => Math.max(max, s.slot), 0)
    setSlots(prev => [...prev, { slot: maxSlot + 1, startTime: '8:00', endTime: '8:45' }])
  }

  const handleDelete = (index: number) => {
    setSlots(prev => prev.filter((_, i) => i !== index))
  }

  const handleReset = () => {
    setSlots(getDefaultTimeSlots())
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>上课时间设置</h3>
          <button className={styles.closeBtn} onClick={onClose} title="关闭">✕</button>
        </div>

        <div className={styles.table}>
          <div className={clsx(styles.row, styles.headerRow)}>
            <span className={styles.headerCell}>节次</span>
            <span className={styles.headerCell}>上课时间</span>
            <span className={styles.headerCell}>下课时间</span>
            <span />
          </div>
          {slots.map((s, i) => (
            <div className={styles.row} key={i}>
              <span className={styles.slotNum}>第{s.slot}节</span>
              <input
                className={clsx(styles.input, errors[i]?.start && styles.error)}
                type="text"
                value={s.startTime}
                onChange={e => updateSlot(i, 'startTime', e.target.value)}
                placeholder="HH:mm"
              />
              <input
                className={clsx(styles.input, errors[i]?.end && styles.error)}
                type="text"
                value={s.endTime}
                onChange={e => updateSlot(i, 'endTime', e.target.value)}
                placeholder="HH:mm"
              />
              <button
                className={styles.delBtn}
                onClick={() => handleDelete(i)}
                disabled={slots.length <= 1}
                title="删除"
              >
                ×
              </button>
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
            <button
              className={clsx(styles.confirmBtn, saved && styles.savedBtn)}
              onClick={handleSave}
              disabled={hasErrors || saved}
            >
              {saved ? '已保存 ✓' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
