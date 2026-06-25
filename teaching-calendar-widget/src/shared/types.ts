// ============== 数据结构定义 ==============

export interface TodoItem {
  id: string
  date: string           // ISO 日期 "2026-03-16"
  content: string
  completed: boolean
  createdAt: string
  /** 自动生成的课表待办对应的 ClassEntry id */
  courseEntryId?: string
}

export interface CalendarDay {
  date: string           // ISO 日期
  isCurrentMonth: boolean
  isToday: boolean
  teachingWeek?: number  // 在教学周内则标注周次
  todos: TodoItem[]
  /** 当天是否有课表条目 */
  hasClass?: boolean
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

// ============== 课表相关 ==============

/** 上课时间映射表的一行 */
export interface TimeSlot {
  slot: number            // 节次 1-12
  startTime: string       // "08:00"
  endTime: string         // "08:45"
  label?: string          // 可选标签
}

/** 课表条目 */
export interface ClassEntry {
  id: string
  week: number            // 周次
  dayOfWeek: number       // 1=周一 ... 7=周日
  slot: number            // 节次
  course: string          // 课程名
  class: string           // 班级
  classroom: string       // 教室
}

/** 时间映射表解析结果 */
export interface TimeSlotsResult {
  success: boolean
  data?: TimeSlot[]
  errors: string[]
}

/** 课表解析结果 */
export interface ClassScheduleResult {
  success: boolean
  data?: ClassEntry[]
  errors: string[]
}

/** 原始时间映射表行 */
export interface RawTimeSlotRow {
  slot: number | null
  startTime: string
  endTime: string
}

/** 原始课表行 */
export interface RawClassRow {
  dayOfWeek: number | null
  slot: number | null
  course: string
  class: string
  classroom: string
}

/** 将 ClassEntry 转为 TodoItem */
export function classEntryToTodo(entry: ClassEntry, date: string): TodoItem {
  return {
    id: `class-${entry.id}-${date}`,
    date,
    content: `${entry.course} ${entry.classroom}`,
    completed: false,
    createdAt: new Date().toISOString(),
    courseEntryId: entry.id
  }
}
