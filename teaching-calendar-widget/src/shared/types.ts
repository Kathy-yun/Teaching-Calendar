// ============================================================
// 固态模版 — TypedDict 状态结构定义
// ============================================================
// 定义应用的全部状态 Schema，每个字段都是核心业务变量。
// Zustand store 的 interface 就是此模版的实例化。
//
// 状态分层:
//   Calendar    — 教学日历核心数据
//   Schedule    — 课表 + 时间映射
//   Todo        — 待办列表

// ---- Calendar State（教学日历数据） ----

/** 教学周范围 */
export interface TeachingWeekRange {
  weekNumber: number
  startDate: string      // ISO "yyyy-MM-dd"
  endDate: string        // ISO "yyyy-MM-dd"
}

/** 解析出的教学日历 */
export interface TeachingCalendar {
  readonly id: string
  semester: string
  teachingWeeks: TeachingWeekRange[]
}

// ---- Schedule State（课表数据） ----

/** 课表条目 */
export interface ClassEntry {
  id: string
  week: number            // 周次，0 = 每周重复
  dayOfWeek: number       // 1=周一 … 7=周日
  slot: number            // 节次 1-14
  course: string          // 课程名
  class: string           // 班级
  classroom: string       // 教室
}

/** 上课时间节次 */
export interface TimeSlot {
  slot: number            // 节次 1-14
  startTime: string       // "HH:mm"
  endTime: string         // "HH:mm"
  label?: string          // 可选标签（映射表第四列）
}

// ---- Todo State（待办数据） ----

/** 待办条目 */
export interface TodoItem {
  id: string
  date: string             // ISO "yyyy-MM-dd"
  content: string
  completed: boolean
  createdAt: string
  courseEntryId?: string   // 自动生成的课表待办对应的 ClassEntry.id
}

// ---- CalendarDay（月历每一天的展示数据） ----

/** 月历单元格数据 */
export interface CalendarDay {
  date: string             // ISO "yyyy-MM-dd"
  isCurrentMonth: boolean
  isToday: boolean
  teachingWeek?: number    // 在教学周内则标注周次
  hasClass?: boolean       // 当天是否有课表条目
}

// ---- Parse Result（解析结果） ----

export interface ParseResult {
  success: boolean
  data?: TeachingCalendar
  errors: string[]
}

// ============================================================
// 完整 State Schema — Zustand Store 即此模版的运行时实例
// ============================================================

/** Calendar Store 状态（教学日历 + 课表 + 待办） */
