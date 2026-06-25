import React, { useState, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { TitleBar } from './components/TitleBar'
import { MonthView } from './components/MonthView'
import { TodoPanel } from './components/TodoPanel'
import { UploadPanel } from './components/UploadPanel'
import { useCalendarStore } from './store/calendarStore'
import { parseFile, parseClassScheduleFile, parseTimeSlotsFile } from './parsers'
import styles from './App.module.css'

function App() {
  const calendar = useCalendarStore((s) => s.currentCalendar)
  const setCalendar = useCalendarStore((s) => s.setCalendar)
  const isLoading = useCalendarStore((s) => s.isLoading)
  const setLoading = useCalendarStore((s) => s.setLoading)
  const todos = useCalendarStore((s) => s.todos)
  const addTodo = useCalendarStore((s) => s.addTodo)
  const toggleTodo = useCalendarStore((s) => s.toggleTodo)
  const deleteTodo = useCalendarStore((s) => s.deleteTodo)
  const timeSlots = useCalendarStore((s) => s.timeSlots)
  const setTimeSlots = useCalendarStore((s) => s.setTimeSlots)
  const classEntries = useCalendarStore((s) => s.classEntries)
  const setClassEntries = useCalendarStore((s) => s.setClassEntries)
  const generateClassTodos = useCalendarStore((s) => s.generateClassTodos)
  const removeAutoTodos = useCalendarStore((s) => s.removeAutoTodos)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

  const previousCalendar = useCalendarStore((s) => s.previousCalendar)
  const goBack = useCalendarStore((s) => s.goBack)

  const clearAll = useCalendarStore((s) => s.clearAll)

  const handleFileUpload = useCallback(async (file: File) => {
    const result = await parseFile(file)
    if (result.success && result.data) {
      setCalendar(result.data)
      const today = new Date()
      setCurrentDate(today)
      setSelectedDate(format(today, 'yyyy-MM-dd'))
    }
  }, [setCalendar])

  // 上传上课课表
  const handleScheduleUpload = useCallback(async () => {
    try {
      const result = await (window as any).widgetAPI?.openFile?.()
      if (!result) return

      const readResult = await (window as any).widgetAPI?.readFile?.(result)
      if (!readResult) return

      setLoading(true)
      const buffer = new Uint8Array(readResult.buffer).buffer
      const parseResult = parseClassScheduleFile(buffer)

      if (parseResult.success && parseResult.data) {
        // 如果已有课表，先移除旧自动待办
        if (classEntries.length > 0) {
          removeAutoTodos()
        }

        // 设置课表条目（保留解析出的周次）
        setClassEntries(parseResult.data)

        // 生成课表待办
        if (calendar) {
          generateClassTodos()
        }
      } else {
        alert(parseResult.errors.join('\n') || '解析失败')
      }
    } catch (err) {
      console.error('上传课表失败:', err)
      alert('上传失败')
    } finally {
      setLoading(false)
    }
  }, [setClassEntries, generateClassTodos, removeAutoTodos, calendar, classEntries.length, setLoading])

  // 上传上课时间映射表
  const handleTimeSlotsUpload = useCallback(async () => {
    try {
      const result = await (window as any).widgetAPI?.openFile?.()
      if (!result) return

      const readResult = await (window as any).widgetAPI?.readFile?.(result)
      if (!readResult) return

      setLoading(true)
      const buffer = new Uint8Array(readResult.buffer).buffer
      const parseResult = parseTimeSlotsFile(buffer)

      if (parseResult.success && parseResult.data) {
        setTimeSlots(parseResult.data)
      } else {
        alert(parseResult.errors.join('\n') || '解析失败')
      }
    } catch (err) {
      console.error('上传时间映射表失败:', err)
      alert('上传失败')
    } finally {
      setLoading(false)
    }
  }, [setTimeSlots, setLoading])

  // 移除课表
  const handleRemoveSchedule = useCallback(() => {
    removeAutoTodos()
    setClassEntries([])
  }, [removeAutoTodos, setClassEntries])

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
    const d = new Date(date + 'T00:00:00')
    setCurrentDate(d)
  }, [])

  const handleDateDoubleClick = useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  const handleAddTodo = useCallback((date: string, content: string) => {
    addTodo({
      id: crypto.randomUUID(),
      date,
      content,
      completed: false,
      createdAt: new Date().toISOString()
    })
  }, [addTodo])

  const handleBackToToday = useCallback(() => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(format(today, 'yyyy-MM-dd'))
  }, [])

  // Find teaching week for the selected date
  const selectedTeachingWeek = useMemo(() => {
    if (!calendar || !selectedDate) return null
    for (const tw of calendar.teachingWeeks) {
      if (selectedDate >= tw.startDate && selectedDate <= tw.endDate) {
        return tw.weekNumber
      }
    }
    return null
  }, [calendar, selectedDate])

  const headerTitle = useMemo(() => {
    if (calendar) {
      return `${calendar.semester}`
    }
    return '教学日历挂件'
  }, [calendar])

  return (
    <div className={styles.app}>
      <TitleBar
        semester={headerTitle}
        weekInfo={calendar && selectedTeachingWeek ? `第 ${selectedTeachingWeek} 周` : ''}
        onBack={!calendar && previousCalendar ? goBack : undefined}
      />

      {!calendar ? (
        <div className={styles.empty}>
          <UploadPanel onFile={handleFileUpload} isLoading={isLoading} />
        </div>
      ) : (
        <>
          <MonthView
            calendar={calendar}
            currentDate={currentDate}
            selectedDate={selectedDate}
            onDateChange={setCurrentDate}
            onDateSelect={handleDateSelect}
            onDateDoubleClick={handleDateDoubleClick}
            onBackToToday={handleBackToToday}
            onChangeCalendar={clearAll}
            classEntries={classEntries}
            timeSlots={timeSlots}
          />

          <TodoPanel
            todos={todos}
            selectedDate={selectedDate}
            classEntries={classEntries}
            timeSlots={timeSlots}
            onAdd={handleAddTodo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onUploadSchedule={handleScheduleUpload}
            onRemoveSchedule={handleRemoveSchedule}
            onUploadTimeSlots={handleTimeSlotsUpload}
          />
        </>
      )}
    </div>
  )
}

export default App
