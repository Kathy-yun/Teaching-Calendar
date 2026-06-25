// ============== 数据结构定义 ==============

export interface TodoItem {
  id: string
  date: string           // ISO 日期 "2026-03-16"
  content: string
  completed: boolean
  createdAt: string
}

export interface CalendarDay {
  date: string           // ISO 日期
  isCurrentMonth: boolean
  isToday: boolean
  teachingWeek?: number  // 在教学周内则标注周次
  todos: TodoItem[]
}

export interface TeachingWeekRange {
  weekNumber: number
  startDate: string      // ISO
  endDate: string
  content: string[]
}

export interface TeachingCalendar {
  id: string
  fileName: string
  fileFormat: string
  semester: string
  teachingWeeks: TeachingWeekRange[]
  createdAt: string
}

export interface ParseResult {
  success: boolean
  data?: TeachingCalendar
  errors: string[]
}

export interface RawCalendarRow {
  week: number | null
  monday: string
  tuesday: string
  wednesday: string
  thursday: string
  friday: string
  saturday: string
  notes: string
}
