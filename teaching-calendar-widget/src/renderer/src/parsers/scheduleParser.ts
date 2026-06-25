import * as XLSX from 'xlsx'
import type { TimeSlot, TimeSlotsResult, ClassEntry, ClassScheduleResult, RawTimeSlotRow, RawClassRow } from '@shared/types'

const DAY_MAP: Record<string, number> = {
  '周一': 1, '星期一': 1, '1': 1,
  '周二': 2, '星期二': 2, '2': 2,
  '周三': 3, '星期三': 3, '3': 3,
  '周四': 4, '星期四': 4, '4': 4,
  '周五': 5, '星期五': 5, '5': 5,
  '周六': 6, '星期六': 6, '6': 6,
  '周日': 7, '星期日': 7, '7': 7,
}

/**
 * 解析上课时间映射表
 * 列结构: A=节次 | B=开始时间(HH:mm) | C=结束时间(HH:mm) | D=可选标签
 */
export function parseTimeSlotsFile(buffer: ArrayBuffer): TimeSlotsResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    if (!sheet) {
      return { success: false, errors: ['文件为空'] }
    }

    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]

    if (!rawData || rawData.length < 2) {
      return { success: false, errors: ['文件内容为空或格式不正确'] }
    }

    const timeSlots: TimeSlot[] = []

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i]
      const slotVal = parseInt(String(row[0] || '').trim())

      if (isNaN(slotVal) || slotVal < 1) continue

      const startTime = String(row[1] || '').trim()
      const endTime = String(row[2] || '').trim()
      const label = String(row[3] || '').trim() || undefined

      if (!startTime || !endTime) continue

      timeSlots.push({
        slot: slotVal,
        startTime,
        endTime,
        label
      })
    }

    if (timeSlots.length === 0) {
      return { success: false, errors: ['未能解析出任何时间节次'] }
    }

    return { success: true, data: timeSlots, errors: [] }
  } catch (err) {
    console.error('[TimeSlotParser] Error:', err)
    return {
      success: false,
      errors: [`解析失败: ${err instanceof Error ? err.message : String(err)}`]
    }
  }
}

/**
 * 解析上课课表
 * 列结构: A=星期 | B=节次 | C=课程 | D=班级 | E=教室
 */
export function parseClassScheduleFile(buffer: ArrayBuffer): ClassScheduleResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    if (!sheet) {
      return { success: false, errors: ['文件为空'] }
    }

    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]

    if (!rawData || rawData.length < 2) {
      return { success: false, errors: ['文件内容为空或格式不正确'] }
    }

    const entries: ClassEntry[] = []

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i]
      if (!row || row.length < 3) continue

      const dayRaw = String(row[0] || '').trim()
      const slotVal = parseInt(String(row[1] || '').trim())
      const course = String(row[2] || '').trim()
      const cls = String(row[3] || '').trim()
      const classroom = String(row[4] || '').trim()

      // 跳过空行
      if (!dayRaw && !course) continue

      const dayOfWeek = DAY_MAP[dayRaw] || DAY_MAP[String(row[0] || '').trim()]
      if (!dayOfWeek || isNaN(slotVal) || slotVal < 1 || !course) continue

      entries.push({
        id: crypto.randomUUID(),
        week: 0, // 周次在生成待办时根据日期计算
        dayOfWeek,
        slot: slotVal,
        course,
        class: cls,
        classroom
      })
    }

    if (entries.length === 0) {
      return { success: false, errors: ['未能解析出任何课程条目'] }
    }

    return { success: true, data: entries, errors: [] }
  } catch (err) {
    console.error('[ClassScheduleParser] Error:', err)
    return {
      success: false,
      errors: [`解析失败: ${err instanceof Error ? err.message : String(err)}`]
    }
  }
}

/**
 * 根据日期获取对应的教学周次
 */
export function getWeekNumberForDate(dateStr: string, teachingWeeks: { weekNumber: number; startDate: string; endDate: string }[]): number | null {
  for (const tw of teachingWeeks) {
    if (dateStr >= tw.startDate && dateStr <= tw.endDate) {
      return tw.weekNumber
    }
  }
  return null
}

/**
 * 获取日期对应的星期几 (1=周一 ... 7=周日)
 */
export function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  return day === 0 ? 7 : day
}

/**
 * 根据 ClassEntry 和 TimeSlot 生成 TodoItem 的内容文本
 */
export function formatClassEntryContent(entry: ClassEntry, timeSlot?: TimeSlot): string {
  const parts: string[] = []

  if (timeSlot) {
    parts.push(`${timeSlot.startTime}-${timeSlot.endTime}`)
  }

  parts.push(entry.course)

  if (entry.classroom) {
    parts.push(entry.classroom)
  }

  return parts.join(' ')
}

/**
 * 为指定日期生成该日所有课表条目的 TodoItem 列表
 */
export function generateClassTodosForDate(
  dateStr: string,
  classEntries: ClassEntry[],
  timeSlots: TimeSlot[],
  teachingWeeks: { weekNumber: number; startDate: string; endDate: string }[]
): { todo: import('@shared/types').TodoItem; entry: ClassEntry }[] {
  const weekNum = getWeekNumberForDate(dateStr, teachingWeeks)
  if (!weekNum) return []

  const dayOfWeek = getDayOfWeek(dateStr)

  // 筛选当天、当前周的课表条目
  const matched = classEntries.filter(e => e.week === 0 || e.week === weekNum)
  const todayEntries = matched.filter(e => e.dayOfWeek === dayOfWeek)

  const slotMap = new Map(timeSlots.map(s => [s.slot, s]))

  return todayEntries
    .sort((a, b) => a.slot - b.slot)
    .map(entry => {
      const timeSlot = slotMap.get(entry.slot)
      const content = formatClassEntryContent(entry, timeSlot)
      return {
        todo: {
          id: `class-${entry.id}-${dateStr}`,
          date: dateStr,
          content,
          completed: false,
          createdAt: new Date().toISOString(),
          courseEntryId: entry.id
        },
        entry
      }
    })
}
