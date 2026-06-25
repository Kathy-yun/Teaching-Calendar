import { create } from 'zustand'
import type { TeachingCalendar, ParseResult, TodoItem, TimeSlot, ClassEntry } from '@shared/types'
import { generateClassTodosForDate, getWeekNumberForDate, getDayOfWeek } from '../parsers/scheduleParser'

interface CalendarState {
  currentCalendar: TeachingCalendar | null
  previousCalendar: TeachingCalendar | null
  parseResults: ParseResult[]
  isLoading: boolean
  todos: TodoItem[]

  // 课表相关
  timeSlots: TimeSlot[]
  classEntries: ClassEntry[]

  setCalendar: (calendar: TeachingCalendar) => void
  addParseResult: (result: ParseResult) => void
  removeParseResult: (id: string) => void
  setLoading: (loading: boolean) => void
  addTodo: (todo: TodoItem) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  getTodosForDate: (date: string) => TodoItem[]
  clearAll: () => void
  goBack: () => void

  // 时间映射表
  setTimeSlots: (slots: TimeSlot[]) => void

  // 课表
  setClassEntries: (entries: ClassEntry[]) => void
  generateClassTodos: (startDate?: string, endDate?: string) => void
  removeAutoTodos: () => void
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentCalendar: null,
  previousCalendar: null,
  parseResults: [],
  isLoading: false,
  todos: [],
  timeSlots: [],
  classEntries: [],

  setCalendar: (calendar) =>
    set({ currentCalendar: calendar }),

  addParseResult: (result) =>
    set((state) => ({
      parseResults: [...state.parseResults, result]
    })),

  removeParseResult: (id) =>
    set((state) => ({
      parseResults: state.parseResults.filter(r => r.data?.id !== id)
    })),

  setLoading: (loading) =>
    set({ isLoading: loading }),

  addTodo: (todo) =>
    set((state) => ({
      todos: [...state.todos, todo]
    })),

  toggleTodo: (id) =>
    set((state) => ({
      todos: state.todos.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    })),

  deleteTodo: (id) =>
    set((state) => ({
      todos: state.todos.filter(t => t.id !== id)
    })),

  getTodosForDate: (date) =>
    get().todos.filter(t => t.date === date),

  clearAll: () =>
    set((state) => ({
      currentCalendar: null,
      previousCalendar: state.currentCalendar,
      parseResults: [],
      todos: [],
      classEntries: []
    })),

  goBack: () =>
    set((state) => ({
      currentCalendar: state.previousCalendar,
      previousCalendar: null
    })),

  // 设置上课时间映射表
  setTimeSlots: (slots) =>
    set({ timeSlots: slots }),

  // 设置课表条目
  setClassEntries: (entries) =>
    set({ classEntries: entries }),

  // 根据教学日历的周范围，为所有周生成课表待办
  generateClassTodos: (startDate?: string, endDate?: string) => {
    const { currentCalendar, classEntries, timeSlots, todos } = get()
    if (!currentCalendar || classEntries.length === 0) return

    // 移除旧的自动生成待办
    const manualTodos = todos.filter(t => !t.courseEntryId)

    const newTodos: TodoItem[] = []

    for (const tw of currentCalendar.teachingWeeks) {
      // 如果指定了日期范围，跳过范围外的周
      if (startDate && tw.endDate < startDate) continue
      if (endDate && tw.startDate > endDate) continue

      // 遍历该周的每一天
      const cur = new Date(tw.startDate + 'T00:00:00')
      const end = new Date(tw.endDate + 'T00:00:00')
      while (cur <= end) {
        const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
        const dayOfWeek = getDayOfWeek(dateStr)

        // 筛选当天的课表条目
        const todayEntries = classEntries.filter(e => e.dayOfWeek === dayOfWeek)

        const slotMap = new Map(timeSlots.map(s => [s.slot, s]))

        for (const entry of todayEntries) {
          const ts = slotMap.get(entry.slot)
          const content = ts
            ? `${ts.startTime}-${ts.endTime} ${entry.course} ${entry.classroom}`
            : `第${entry.slot}节 ${entry.course} ${entry.classroom}`

          newTodos.push({
            id: `class-${entry.id}-${dateStr}`,
            date: dateStr,
            content,
            completed: false,
            createdAt: new Date().toISOString(),
            courseEntryId: entry.id
          })
        }

        cur.setDate(cur.getDate() + 1)
      }
    }

    set({ todos: [...manualTodos, ...newTodos] })
  },

  // 移除所有自动生成的课表待办
  removeAutoTodos: () =>
    set((state) => ({
      todos: state.todos.filter(t => !t.courseEntryId),
      classEntries: []
    }))
}))
