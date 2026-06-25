import { useState, useMemo } from 'react'
import clsx from 'clsx'
import { format } from 'date-fns'
import { addDays } from 'date-fns'
import type { TodoItem, ClassEntry, TimeSlot } from '@shared/types'
import { TodoModal } from './TodoModal'
import styles from './TodoPanel.module.css'

interface TodoPanelProps {
  todos: TodoItem[]
  selectedDate: string | null
  classEntries: ClassEntry[]
  timeSlots: TimeSlot[]
  onAdd: (date: string, content: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUploadSchedule: () => void
  onRemoveSchedule: () => void
}

export function TodoPanel({
  todos, selectedDate, classEntries, timeSlots,
  onAdd, onToggle, onDelete, onUploadSchedule, onRemoveSchedule
}: TodoPanelProps) {
  const [showModal, setShowModal] = useState(false)

  const handleAdd = (date: string, content: string) => {
    onAdd(date, content)
    setShowModal(false)
  }

  // 自动生成的课表条目（选中日期 + 未来几天）
  const { autoTodos, displayTodos } = useMemo(() => {
    const auto: { todo: TodoItem; entry: ClassEntry; slot?: TimeSlot }[] = []
    const manual: TodoItem[] = []

    const datesToShow = new Set<string>()
    if (selectedDate) {
      datesToShow.add(selectedDate)
      // 也包含未来3天
      for (let i = 1; i <= 3; i++) {
        const d = addDays(new Date(selectedDate + 'T00:00:00'), i)
        datesToShow.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
      }
    }

    const slotMap = new Map(timeSlots.map(s => [s.slot, s]))

    for (const todo of todos) {
      if (todo.courseEntryId) {
        const entry = classEntries.find(e => e.id === todo.courseEntryId)
        if (entry && datesToShow.has(todo.date)) {
          auto.push({
            todo,
            entry,
            slot: slotMap.get(entry.slot)
          })
        }
      } else {
        if (datesToShow.has(todo.date) || !selectedDate) {
          manual.push(todo)
        }
      }
    }

    // 按日期和时间排序
    auto.sort((a, b) => {
      const dc = a.todo.date.localeCompare(b.todo.date)
      if (dc !== 0) return dc
      return a.entry.slot - b.entry.slot
    })

    manual.sort((a, b) => a.date.localeCompare(b.date))

    return {
      autoTodos: auto,
      displayTodos: manual
    }
  }, [todos, selectedDate, classEntries, timeSlots])

  const hasSchedule = classEntries.length > 0

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>📝 待办</span>
        <div className={styles.headerActions}>
          {hasSchedule && (
            <button className={styles.removeScheduleBtn} onClick={onRemoveSchedule} title="移除课表">
              移除课表
            </button>
          )}
          {!hasSchedule && (
            <button className={styles.uploadScheduleBtn} onClick={onUploadSchedule} title="上传课表">
              上传课表
            </button>
          )}
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            + 添加
          </button>
        </div>
      </div>

      {autoTodos.length === 0 && displayTodos.length === 0 ? (
        <p className={styles.empty}>双击日期创建待办</p>
      ) : (
        <div className={styles.list}>
          {autoTodos.map(({ todo, entry, slot }) => (
            <ClassItem
              key={todo.id}
              todo={todo}
              entry={entry}
              timeSlot={slot}
              onToggle={() => onToggle(todo.id)}
            />
          ))}
          {displayTodos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => onToggle(todo.id)}
              onDelete={() => onDelete(todo.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <TodoModal
          defaultDate={selectedDate || format(new Date(), 'yyyy-MM-dd')}
          onConfirm={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

function ClassItem({
  todo, entry, timeSlot, onToggle
}: {
  todo: TodoItem
  entry: ClassEntry
  timeSlot?: TimeSlot
  onToggle: () => void
}) {
  return (
    <div className={clsx(styles.item, styles.classItem, todo.completed && styles.done)}>
      <button className={styles.check} onClick={onToggle}>
        {todo.completed ? '✓' : '○'}
      </button>
      <div className={styles.classContent}>
        <div className={styles.classMain}>
          {timeSlot && (
            <span className={styles.classTime}>{timeSlot.startTime}-{timeSlot.endTime}</span>
          )}
          <span className={styles.className}>{entry.course}</span>
        </div>
        <div className={styles.classDetail}>
          {entry.classroom && <span className={styles.classRoom}>{entry.classroom}</span>}
          {entry.class && <span className={styles.classGroup}>{entry.class}</span>}
        </div>
      </div>
      <span className={styles.classTag}>课程</span>
    </div>
  )
}

function TodoItem({ todo, onToggle, onDelete }: { todo: TodoItem; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className={clsx(styles.item, todo.completed && styles.done)}>
      <button className={styles.check} onClick={onToggle}>
        {todo.completed ? '✓' : '○'}
      </button>
      <span className={styles.content}>
        <span className={styles.dateTag}>{formatDate(todo.date)}</span>
        {todo.content}
      </span>
      <button className={styles.del} onClick={onDelete}>×</button>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}
