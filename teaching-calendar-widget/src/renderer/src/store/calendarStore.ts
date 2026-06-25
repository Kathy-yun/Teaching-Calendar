import { create } from 'zustand'
import type { TeachingCalendar, ParseResult, TodoItem } from '@shared/types'

interface CalendarState {
  currentCalendar: TeachingCalendar | null
  previousCalendar: TeachingCalendar | null
  parseResults: ParseResult[]
  isLoading: boolean
  todos: TodoItem[]

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
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentCalendar: null,
  previousCalendar: null,
  parseResults: [],
  isLoading: false,
  todos: [],

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
      todos: []
    })),

  goBack: () =>
    set((state) => ({
      currentCalendar: state.previousCalendar,
      previousCalendar: null
    }))
}))
