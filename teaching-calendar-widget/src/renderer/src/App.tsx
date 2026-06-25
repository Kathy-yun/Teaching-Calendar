import React, { useState, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { TitleBar } from './components/TitleBar'
import { MonthView } from './components/MonthView'
import { TodoPanel } from './components/TodoPanel'
import { UploadPanel } from './components/UploadPanel'
import { useCalendarStore } from './store/calendarStore'
import { parseFile } from './parsers'
import styles from './App.module.css'

function App() {
  const calendar = useCalendarStore((s) => s.currentCalendar)
  const setCalendar = useCalendarStore((s) => s.setCalendar)
  const isLoading = useCalendarStore((s) => s.isLoading)
  const todos = useCalendarStore((s) => s.todos)
  const addTodo = useCalendarStore((s) => s.addTodo)
  const toggleTodo = useCalendarStore((s) => s.toggleTodo)
  const deleteTodo = useCalendarStore((s) => s.deleteTodo)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

  const previousCalendar = useCalendarStore((s) => s.previousCalendar)
  const goBack = useCalendarStore((s) => s.goBack)

  const clearAll = useCalendarStore((s) => s.clearAll)

  const handleFileUpload = useCallback(async (file: File) => {
    const result = await parseFile(file)
    if (result.success && result.data) {
      setCalendar(result.data)
      // Navigate to the month containing today's date
      const today = new Date()
      setCurrentDate(today)
      setSelectedDate(format(today, 'yyyy-MM-dd'))
    }
  }, [setCalendar])

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date)
    // Navigate to the month of the selected date
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
            onBackToToday={() => {
              const today = new Date()
              setCurrentDate(today)
              setSelectedDate(format(today, 'yyyy-MM-dd'))
            }}
            onChangeCalendar={clearAll}
          />

          <TodoPanel
            todos={todos}
            selectedDate={selectedDate}
            onAdd={handleAddTodo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        </>
      )}
    </div>
  )
}

export default App
