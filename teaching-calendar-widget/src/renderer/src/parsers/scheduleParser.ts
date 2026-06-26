import * as XLSX from 'xlsx'
import type { TimeSlot, ClassEntry } from '@shared/types'

// 内部返回类型（不导出，仅函数签名使用）
interface ParserResult<T> {
  success: boolean
  data?: T
  errors: string[]
}

const DAY_MAP: Record<string, number> = {
  '星期一': 1, '周一': 1, '1': 1, '一': 1,
  '星期二': 2, '周二': 2, '2': 2, '二': 2,
  '星期三': 3, '周三': 3, '3': 3, '三': 3,
  '星期四': 4, '周四': 4, '4': 4, '四': 4,
  '星期五': 5, '周五': 5, '5': 5, '五': 5,
  '星期六': 6, '周六': 6, '6': 6, '六': 6,
  '星期日': 7, '周日': 7, '7': 7, '日': 7,
}

/**
 * 解析上课时间映射表
 * 支持两种格式：
 * 1. 列结构: A=节次 | B=开始时间(HH:mm) | C=结束时间(HH:mm) | D=可选标签
 * 2. 如果解析失败则返回空数组，使用默认时间映射
 */
export function parseTimeSlotsFile(buffer: ArrayBuffer): ParserResult<TimeSlot[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    if (!sheet) {
      return { success: true, data: getDefaultTimeSlots(), errors: ['文件为空，使用默认时间映射'] }
    }

    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]

    if (!rawData || rawData.length < 2) {
      return { success: true, data: getDefaultTimeSlots(), errors: ['文件内容为空，使用默认时间映射'] }
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
      return { success: true, data: getDefaultTimeSlots(), errors: ['未解析到时间节次，使用默认时间映射'] }
    }

    return { success: true, data: timeSlots, errors: [] }
  } catch (err) {
    console.error('[TimeSlotParser] Error:', err)
    return {
      success: true,
      data: getDefaultTimeSlots(),
      errors: [`解析失败，使用默认时间映射: ${err instanceof Error ? err.message : String(err)}`]
    }
  }
}

/**
 * 解析教师个人课表
 * 格式：
 *   Row 2 (index 2): 表头 — A列空, B=星期一, C=星期二, ..., H=星期日
 *   Row A列: 节次标签 (如 "第12节", "第34节", "午12节", "晚12节"...)
 *   Cells: 多行文本 = 课程名\n周次\n教室\n班级
 */
export function parseClassScheduleFile(buffer: ArrayBuffer): ParserResult<ClassEntry[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    if (!sheet) {
      return { success: false, errors: ['文件为空'] }
    }

    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]

    if (!rawData || rawData.length < 3) {
      return { success: false, errors: ['文件内容为空或格式不正确'] }
    }

    // 1. 找到表头行（包含"星期"的行），确定星期列映射
    let headerRowIdx = -1
    let dayColMap: Record<number, number> = {} // colIndex -> dayOfWeek

    for (let r = 0; r < Math.min(rawData.length, 5); r++) {
      const row = rawData[r]
      for (let c = 0; c < (row?.length || 0); c++) {
        const cell = String(row[c] || '').trim()
        if (cell.includes('星期') || cell.includes('周')) {
          headerRowIdx = r
          for (let cc = 0; cc < (row?.length || 0); cc++) {
            const headerCell = String(row[cc] || '').trim()
            const day = DAY_MAP[headerCell]
            if (day) {
              dayColMap[cc] = day
            }
          }
          break
        }
      }
      if (headerRowIdx >= 0) break
    }

    if (headerRowIdx < 0 || Object.keys(dayColMap).length === 0) {
      return { success: false, errors: ['未找到星期表头行，请确认文件格式'] }
    }

    console.log('[ScheduleParser] Header row:', headerRowIdx, 'Day cols:', dayColMap)

    // 2. 解析节次标签行，建立 rowIndex -> [slot1, slot2, ...] 映射
    const slotLabels: Record<number, number[]> = {}

    for (let r = headerRowIdx + 1; r < rawData.length; r++) {
      const row = rawData[r]
      if (!row || row.length === 0) continue

      const colA = String(row[0] || '').trim()
      if (!colA) continue

      // 匹配节次标签: 第12节(第1-2节), 第34节(第3-4节), 晚12节, 午12节等
      const slotMatch = colA.match(/(?:第|晚|午)?(\d+)\s*节/)
      if (!slotMatch) continue

      // "第12节" 表示第1、2节, "第34节" 表示第3、4节, 以此类推
      const slotDigits = slotMatch[1].split('').map(Number).filter(n => n >= 1 && n <= 14)

      // 跳过午休标记
      if (colA.includes('午')) continue

      slotLabels[r] = slotDigits
    }

    console.log('[ScheduleParser] Slot labels by row:', JSON.stringify(slotLabels))

    // 3. 重新遍历数据行，提取课程信息
    const entries: ClassEntry[] = []

    for (let r = headerRowIdx + 1; r < rawData.length; r++) {
      const row = rawData[r]
      if (!row || row.length === 0) continue

      const colA = String(row[0] || '').trim()
      if (!colA) continue

      // 跳过午休行
      if (colA.includes('午')) continue
      if (!colA.match(/(?:第|晚)?(\d+)\s*节/)) continue

      for (let c = 1; c < (row?.length || 0); c++) {
        const cellRaw = String(row[c] || '').trim()
        if (!cellRaw || cellRaw === ' ') continue

        // 检查此行是否有节次标签
        const slots = slotLabels[r]
        if (!slots || slots.length === 0) continue

        // 检查此列是否是星期列
        const dayOfWeek = dayColMap[c]
        if (!dayOfWeek) continue

        // 解析单元格多行内容
        const lines = cellRaw.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length < 1) continue

        const course = lines[0]
        if (!course) continue

        // 解析周次
        const weekRanges: number[] = []
        for (let li = 1; li < lines.length; li++) {
          const line = lines[li]
          if (line.includes('周')) {
            const weeks = parseWeekRanges(line)
            weekRanges.push(...weeks)
          }
        }

        // 解析教室和班级
        let classroom = ''
        let cls = ''
        for (let li = 1; li < lines.length; li++) {
          const line = lines[li]
          if (line.includes('周')) continue
          if (!classroom && !line.match(/^\d/)) {
            // 教室通常是字母+数字组合如 "综518", "教302"
            classroom = line
          } else if (!cls) {
            cls = line
          }
        }

        // 为每个周次和节次创建条目
        for (const week of weekRanges.length > 0 ? weekRanges : [0]) {
          for (const slot of slots) {
            entries.push({
              id: crypto.randomUUID(),
              week,
              dayOfWeek,
              slot,
              course,
              class: cls,
              classroom
            })
          }
        }
      }
    }

    console.log('[ScheduleParser] Parsed', entries.length, 'entries')

    if (entries.length === 0) {
      return { success: false, errors: ['未能解析出任何课程条目，请确认文件格式'] }
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
 * 解析周次范围，如 "1-4,6-8,10-12" → [1,2,3,4,6,7,8,10,11,12]
 */
function parseWeekRanges(text: string): number[] {
  const weeks: number[] = []
  const cleaned = text.replace(/周/g, '').trim()

  const parts = cleaned.split(',')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number)
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let w = start; w <= end; w++) {
          weeks.push(w)
        }
      }
    } else {
      const w = parseInt(trimmed)
      if (!isNaN(w)) {
        weeks.push(w)
      }
    }
  }

  return weeks
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
 * 默认上课时间映射表（顺义校区 2025-2026-2）
 */
export function getDefaultTimeSlots(): TimeSlot[] {
  return [
    { slot: 1,  startTime: '8:00', endTime: '8:45' },
    { slot: 2,  startTime: '8:45', endTime: '9:30' },
    { slot: 3,  startTime: '9:45', endTime: '10:30' },
    { slot: 4,  startTime: '10:30', endTime: '11:15' },
    { slot: 5,  startTime: '11:25', endTime: '12:10' },
    { slot: 6,  startTime: '12:10', endTime: '12:55' },
    { slot: 7,  startTime: '13:05', endTime: '13:50' },
    { slot: 8,  startTime: '13:50', endTime: '14:35' },
    { slot: 9,  startTime: '14:50', endTime: '15:35' },
    { slot: 10, startTime: '15:35', endTime: '16:20' },
    { slot: 11, startTime: '16:30', endTime: '17:15' },
    { slot: 12, startTime: '17:15', endTime: '18:00' },
    { slot: 13, startTime: '18:10', endTime: '18:55' },
    { slot: 14, startTime: '18:55', endTime: '19:40' },
  ]
}
