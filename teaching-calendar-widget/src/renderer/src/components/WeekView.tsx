import { useMemo } from 'react'
import clsx from 'clsx'
import { format, isToday } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { TeachingCalendar, DaySchedule } from '@shared/types'
import styles from './WeekView.module.css'

interface WeekViewProps {
  calendar: TeachingCalendar
  currentWeekIndex: number
}

export function WeekView({ calendar, currentWeekIndex }: WeekViewProps) {
  const week = calendar.weeks[currentWeekIndex]
  if (!week) return null

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className={styles.container}>
      {/* 进度条 */}
      <div className={styles.progressBar}>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${((currentWeekIndex + 1) / calendar.weeks.length) * 100}%` }}
          />
        </div>
        <span className={styles.progressText}>
          第 {currentWeekIndex + 1} / {calendar.weeks.length} 周
        </span>
      </div>

      {/* 星期网格 */}
      <div className={styles.grid}>
        {week.days.map((day, idx) => (
          <DayCell key={idx} day={day} isToday={day.date === todayStr} />
        ))}
      </div>

      {/* 备注 */}
      {week.notes && (
        <div className={styles.notes}>
          <span className={styles.notesLabel}>备注</span>
          <span className={styles.notesText}>{week.notes}</span>
        </div>
      )}
    </div>
  )
}

function DayCell({ day, isToday }: { day: DaySchedule; isToday: boolean }) {
  const weekday = useMemo(() => {
    if (!day.date) return ''
    const d = new Date(day.date + 'T00:00:00')
    return format(d, 'EEE', { locale: zhCN })
  }, [day.date])

  return (
    <div className={clsx(styles.dayCell, isToday && styles.today)}>
      <div className={styles.dayHeader}>
        <span className={styles.dayName}>{weekday}</span>
        <span className={clsx(styles.dayLabel, isToday && styles.todayLabel)}>
          {day.label}
        </span>
      </div>
      <div className={styles.dayBody}>
        {isToday && <div className={styles.todayDot} />}
        {day.notes && <span className={styles.dayNote}>{day.notes}</span>}
      </div>
    </div>
  )
}
