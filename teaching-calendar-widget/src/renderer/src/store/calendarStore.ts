import { create } from 'zustand'
import type { TeachingCalendar, TodoItem, TimeSlot, ClassEntry } from '@shared/types'
import { getDayOfWeek, getDefaultTimeSlots } from '../parsers/scheduleParser'

interface CalendarState {
  currentCalendar: TeachingCalendar | null
  isLoading: boolean
  todos: TodoItem[]

  // 课表相关
  timeSlots: TimeSlot[]
  classEntries: ClassEntry[]

  setCalendar: (calendar: TeachingCalendar) => void
  setLoading: (loading: boolean) => void
  addTodo: (todo: TodoItem) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  getTodosForDate: (date: string) => TodoItem[]
  clearAll: () => void

  // 时间映射表
  setTimeSlots: (slots: TimeSlot[]) => void

  // 课表
  setClassEntries: (entries: ClassEntry[]) => void
  generateClassTodos: (startDate?: string, endDate?: string) => void
  removeAutoTodos: () => void
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentCalendar: null,
  isLoading: false,
  todos: [],
  timeSlots: [],
  classEntries: [],

  setCalendar: (calendar) =>
    set({ currentCalendar: calendar }),

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
    set({
      currentCalendar: null,
      todos: [],
      classEntries: []
    }),

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

    // 如果没有上传时间映射表，使用默认映射
    const slotList = timeSlots.length > 0 ? timeSlots : getDefaultTimeSlots()
    const slotMap = new Map(slotList.map(s => [s.slot, s]))

    // 移除旧的自动生成待办
    const manualTodos = todos.filter(t => !t.courseEntryId)

    const newTodos: TodoItem[] = []

    for (const tw of currentCalendar.teachingWeeks) {
      if (startDate && tw.endDate < startDate) continue
      if (endDate && tw.startDate > endDate) continue

      const cur = new Date(tw.startDate + 'T00:00:00')
      const end = new Date(tw.endDate + 'T00:00:00')
      while (cur <= end) {
        const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
        const dayOfWeek = getDayOfWeek(dateStr)

        // 筛选当天、当前周的课表条目
        // week=0 表示每周都有的课（仅在当前教学周内显示）
        // week>0 表示只在特定教学周显示的课
        const todayEntries = classEntries.filter(e => {
          if (e.dayOfWeek !== dayOfWeek) return false
          if (e.week === 0) return true // 每周重复的课，在教学周范围内显示
          return e.week === tw.weekNumber // 精确匹配周次
        })

        // 按 (course, classroom, class) 分组，合并连续节次
        const groups = new Map<string, ClassEntry[]>()
        for (const entry of todayEntries) {
          const key = `${entry.course}\x00${entry.classroom}\x00${entry.class}`
          if (!groups.has(key)) groups.set(key, [])
          groups.get(key)!.push(entry)
        }

        for (const [, entries] of groups) {
          // 按节次排序
          entries.sort((a, b) => a.slot - b.slot)

          // 合并连续节次
          const merged: { slots: number[], entry: ClassEntry }[] = []
          for (const entry of entries) {
            const last = merged[merged.length - 1]
            if (last && entry.slot === last.slots[last.slots.length - 1] + 1) {
              last.slots.push(entry.slot)
            } else {
              merged.push({ slots: [entry.slot], entry })
            }
          }

          for (const { slots, entry } of merged) {
            const firstSlot = slotMap.get(slots[0])
            const lastSlot = slotMap.get(slots[slots.length - 1])
            let timeStr = ''
            if (firstSlot && lastSlot) {
              timeStr = `${firstSlot.startTime}-${lastSlot.endTime}`
            }

            const content = timeStr
              ? `${timeStr} ${entry.course} ${entry.classroom}`
              : `第${slots.join('+')}节 ${entry.course} ${entry.classroom}`

            newTodos.push({
              id: `class-${entry.id}-${dateStr}-${slots.join('+')}`,
              date: dateStr,
              content,
              completed: false,
              createdAt: new Date().toISOString(),
              courseEntryId: entry.id
            })
          }
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
