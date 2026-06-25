import { parse, addDays } from 'date-fns'
import type { TeachingCalendar, TeachingWeekRange, RawCalendarRow, CalendarDay } from '@shared/types'

/**
 * 从标题推断学期起始年份
 * 例: "2025-2026学年度 第2学期" → 2026年3月
 */
export function inferSemesterYear(title: string): { year: number; month: number } | null {
  const yearMatch = title.match(/(\d{4})-(\d{4})/)
  if (yearMatch) {
    const endYear = parseInt(yearMatch[2])
    return { year: endYear, month: 3 }
  }
  return null
}

/**
 * 将 "03月15日" 格式转为 ISO 日期
 */
export function parseChineseDate(value: string, baseYear: number): string | null {
  if (!value || value.trim() === '') return null

  const match = value.match(/(\d{1,2})月(\d{1,2})日/)
  if (!match) return null

  const month = parseInt(match[1])
  const day = parseInt(match[2])
  const date = new Date(baseYear, month - 1, day)
  return date.toISOString().split('T')[0]
}

/**
 * 将原始 XLS 行数据转为 TeachingCalendar
 */
export function buildCalendarFromRows(
  title: string,
  rows: RawCalendarRow[]
): { calendar: TeachingCalendar; weeks: TeachingWeekRange[] } {
  const semesterInfo = inferSemesterYear(title)
  const baseYear = semesterInfo?.year ?? new Date().getFullYear()

  const weeks: TeachingWeekRange[] = rows.map((row) => {
    // Each row: week number + monday date + tue~sat + sunday
    const monday = parseChineseDate(row.monday, baseYear)
    const sunday = parseChineseDate(row.notes, baseYear)

    // If cross-month, adjust
    const start = monday || ''
    const end = sunday || (start ? addDaysStr(start, 6) : '')

    return {
      weekNumber: row.week ?? 0,
      startDate: start,
      endDate: end,
      content: []
    }
  })

  const calendar: TeachingCalendar = {
    id: crypto.randomUUID(),
    fileName: '',
    fileFormat: 'xls',
    semester: title.trim(),
    teachingWeeks: weeks,
    createdAt: new Date().toISOString()
  }

  return { calendar, weeks }
}

function addDaysStr(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

/**
 * 为月历生成日期数据
 */
export function buildMonthDays(date: Date, calendar: TeachingCalendar): CalendarDay[] {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

  // Start from Monday of the week containing the 1st
  const startWeekday = monthStart.getDay() // 0=Sun
  const mondayOffset = startWeekday === 0 ? -6 : 1 - startWeekday
  const paddedStart = new Date(monthStart)
  paddedStart.setDate(paddedStart.getDate() + mondayOffset)

  const allDays: CalendarDay[] = []
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  for (let i = 0; i < 42; i++) {
    const d = new Date(paddedStart)
    d.setDate(d.getDate() + i)
    const iso = d.toISOString().split('T')[0]
    const inMonth = d.getMonth() === date.getMonth()

    // Check if this date falls within a teaching week
    let teachingWeek: number | undefined
    for (const tw of calendar.teachingWeeks) {
      if (iso >= tw.startDate && iso <= tw.endDate) {
        teachingWeek = tw.weekNumber
        break
      }
    }

    allDays.push({
      date: iso,
      isCurrentMonth: inMonth,
      isToday: iso === todayStr,
      teachingWeek,
      todos: []
    })
  }

  return allDays
}
