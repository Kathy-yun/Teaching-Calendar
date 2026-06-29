import React, { useMemo } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isToday, getDay, addDays } from 'date-fns'
import clsx from 'clsx'
import type { TeachingCalendar, CalendarDay, ClassEntry, TimeSlot } from '@shared/types'
import { getDayOfWeek } from '../parsers/scheduleParser'
import styles from './MonthView.module.css'

interface MonthViewProps {
  calendar: TeachingCalendar | null | undefined
  currentDate: Date
  selectedDate: string | null
  onDateChange: (date: Date) => void
  onDateSelect: (date: string) => void
  onDateDoubleClick: (date: string) => void
  onBackToToday: () => void
  onChangeCalendar?: () => void
  classEntries?: ClassEntry[]
  timeSlots?: TimeSlot[]
}

export function MonthView({
  calendar, currentDate, selectedDate, onDateChange,
  onDateSelect, onDateDoubleClick, onBackToToday, onChangeCalendar,
  classEntries = [], timeSlots = []
}: MonthViewProps) {
  const days = useMemo(() => buildMonthDays(currentDate, calendar || { id: '', semester: '', teachingWeeks: [] }, classEntries, timeSlots), [currentDate, calendar, classEntries, timeSlots])

  const weekdays = ['一', '二', '三', '四', '五', '六', '日']

  const goPrev = () => onDateChange(subMonths(currentDate, 1))
  const goNext = () => onDateChange(addMonths(currentDate, 1))

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(parseInt(e.target.value), month, 1)
    onDateChange(newDate)
  }

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(year, parseInt(e.target.value), 1)
    onDateChange(newDate)
  }

  // Generate year options (current year ± 5)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)
  const monthOptions = Array.from({ length: 12 }, (_, i) => i)

  return (
    <div className={styles.container}>
      {/* Month navigation with dropdown */}
      <div className={styles.nav}>
        <button className={styles.navBtn} onClick={goPrev}>‹</button>

        <div className={styles.titleGroup}>
          <select className={styles.yearSelect} value={year} onChange={handleYearChange}>
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select className={styles.monthSelect} value={month} onChange={handleMonthChange}>
            {monthOptions.map(m => (
              <option key={m} value={m}>{m + 1}月</option>
            ))}
          </select>
        </div>

        <button className={styles.navBtn} onClick={goNext}>›</button>
      </div>

      {/* Weekday headers */}
      <div className={styles.weekdays}>
        {weekdays.map(d => (
          <div key={d} className={styles.weekday}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className={styles.grid}>
        {days.map((day, i) => (
          <DayCell
            key={i}
            day={day}
            isSelected={day.date === selectedDate}
            onClick={() => day.date && onDateSelect(day.date)}
            onDoubleClick={() => day.date && onDateDoubleClick(day.date)}
          />
        ))}
      </div>

      {/* Footer with "回到今天" and "上传/更换教学周历" buttons */}
      <div className={styles.footer}>
        <button className={styles.todayBtn} onClick={onBackToToday}>
          回到今天
        </button>
        {onChangeCalendar && (
          <button className={styles.changeBtn} onClick={onChangeCalendar}>
            {calendar ? '更换教学周历' : '上传教学周历'}
          </button>
        )}
      </div>
    </div>
  )
}

function DayCell({ day, isSelected, onClick, onDoubleClick }: { day: CalendarDay; isSelected: boolean; onClick: () => void; onDoubleClick: () => void }) {
  const cls = clsx(
    styles.dayCell,
    !day.isCurrentMonth && styles.otherMonth,
    day.isToday && styles.today,
    day.teachingWeek && styles.teachingWeek,
    isSelected && styles.selected,
    day.hasClass && styles.hasClass
  )

  return (
    <div className={cls} onClick={onClick} onDoubleClick={onDoubleClick}>
      {day.isToday && <span className={styles.todayDot} />}
      {day.hasClass && !day.isToday && <span className={styles.classDot} />}
      <span className={clsx(styles.dayNum, day.isToday && styles.todayNum)}>
        {day.date ? format(new Date(day.date + 'T00:00:00'), 'd') : ''}
      </span>
      {day.hasClass && <span className={styles.classBadge}>课</span>}
    </div>
  )
}

function buildMonthDays(
  date: Date, calendar: TeachingCalendar,
  classEntries: ClassEntry[], timeSlots: TimeSlot[]
): CalendarDay[] {
  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad to start on Monday
  const firstDay = days[0]
  const startWeekday = getDay(firstDay) // 0=Sun
  const mondayOffset = startWeekday === 0 ? -6 : 1 - startWeekday
  const paddedStart = addDays(firstDay, mondayOffset)

  // 预计算课表：周次 -> Set<dayOfWeek>
  const scheduleByWeek = new Map<number, Set<number>>()
  for (const entry of classEntries) {
    const key = entry.week || 0
    if (!scheduleByWeek.has(key)) {
      scheduleByWeek.set(key, new Set())
    }
    scheduleByWeek.get(key)!.add(entry.dayOfWeek)
  }

  const allDays: CalendarDay[] = []
  for (let i = 0; i < 42; i++) {
    const d = addDays(paddedStart, i)
    const iso = format(d, 'yyyy-MM-dd')
    const inMonth = d.getMonth() === date.getMonth()

    // Check if this date falls within a teaching week
    let teachingWeek: number | undefined
    let hasClass = false

    for (const tw of calendar.teachingWeeks) {
      if (iso >= tw.startDate && iso <= tw.endDate) {
        teachingWeek = tw.weekNumber

        // 检查当天是否有课
        const dayOfWeek = getDayOfWeek(iso)
        const weekSchedule = scheduleByWeek.get(0) // 每周重复的
        const specificSchedule = scheduleByWeek.get(teachingWeek) // 特定周的

        if ((weekSchedule && weekSchedule.has(dayOfWeek)) ||
            (specificSchedule && specificSchedule.has(dayOfWeek))) {
          hasClass = true
        }
        break
      }
    }

    allDays.push({
      date: iso,
      isCurrentMonth: inMonth,
      isToday: isToday(d),
      teachingWeek,
      hasClass
    })
  }

  return allDays
}
