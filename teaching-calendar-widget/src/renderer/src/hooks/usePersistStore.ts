import { useEffect, useRef, useCallback } from 'react'
import { useCalendarStore } from '../store/calendarStore'
import type { TeachingCalendar, TodoItem, TimeSlot, ClassEntry } from '@shared/types'

const STORE_KEYS = {
  currentCalendar: 'currentCalendar',
  todos: 'todos',
  timeSlots: 'timeSlots',
  classEntries: 'classEntries'
} as const

let saveTimer: ReturnType<typeof setTimeout> | null = null
let isLoading = false

/**
 * 自动持久化 store 状态到 electron-store。
 * 使用防抖（300ms）避免频繁写入。
 */
export function usePersistStore() {
  const widgetAPI = window.widgetAPI

  const save = useCallback(async () => {
    if (isLoading) return
    const state = useCalendarStore.getState()
    try {
      await widgetAPI.storeSave(STORE_KEYS.currentCalendar, state.currentCalendar)
      await widgetAPI.storeSave(STORE_KEYS.todos, state.todos)
      await widgetAPI.storeSave(STORE_KEYS.timeSlots, state.timeSlots)
      await widgetAPI.storeSave(STORE_KEYS.classEntries, state.classEntries)
    } catch (e) {
      console.error('[persist] save failed:', e)
    }
  }, [widgetAPI])

  const load = useCallback(async () => {
    if (isLoading) return
    isLoading = true
    try {
      const [calendar, todos, timeSlots, classEntries] = await Promise.all([
        widgetAPI.storeLoad(STORE_KEYS.currentCalendar),
        widgetAPI.storeLoad(STORE_KEYS.todos),
        widgetAPI.storeLoad(STORE_KEYS.timeSlots),
        widgetAPI.storeLoad(STORE_KEYS.classEntries)
      ])

      const set = useCalendarStore.setState

      if (calendar && typeof calendar === 'object') {
        set({ currentCalendar: calendar as TeachingCalendar })
      }
      if (Array.isArray(todos)) {
        set({ todos: todos as TodoItem[] })
      }
      if (Array.isArray(timeSlots)) {
        set({ timeSlots: timeSlots as TimeSlot[] })
      }
      if (Array.isArray(classEntries)) {
        set({ classEntries: classEntries as ClassEntry[] })
      }
    } catch (e) {
      console.error('[persist] load failed:', e)
    } finally {
      isLoading = false
    }
  }, [widgetAPI])

  useEffect(() => {
    // 启动时恢复数据
    load()

    // 订阅 store 变化，防抖保存
    const unsub = useCalendarStore.subscribe(() => {
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        save()
      }, 300)
    })

    return () => {
      unsub()
      if (saveTimer) clearTimeout(saveTimer)
    }
  }, [load, save])
}
