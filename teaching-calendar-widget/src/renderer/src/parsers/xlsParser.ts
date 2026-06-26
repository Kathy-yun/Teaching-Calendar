import * as XLSX from 'xlsx'
import type { ParseResult, TeachingCalendar, TeachingWeekRange } from '@shared/types'

/**
 * 使用 SheetJS 解析 XLS 文件
 * 列结构: A=周次 | B=起始日(空/合并) | C=周一(数字) | D=周二 | ... | H=周六(MM月DD日) | I=备注
 */
export function parseXlsFile(buffer: ArrayBuffer): ParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    // Read title from merged cell
    const titleCell = sheet['A1']
    const title = (titleCell?.v || '').toString().replace(/[\r\n]+/g, ' ').trim()

    // Read all data rows (sheet_to_json with header:1)
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][]

    if (!rawData || rawData.length < 3) {
      return { success: false, errors: ['文件内容为空或格式不正确'] }
    }

    // Find header row (contains "周次" in col A)
    let dataStart = 0
    for (let i = 0; i < Math.min(rawData.length, 5); i++) {
      if (String(rawData[i]?.[0] || '').includes('周次')) {
        dataStart = i + 1
        break
      }
    }

    const baseYear = inferYear(title)
    const teachingWeeks: TeachingWeekRange[] = []

    console.log('[Parser] Title:', title)
    console.log('[Parser] Data starts at row:', dataStart)

    for (let i = dataStart; i < rawData.length; i++) {
      const row = rawData[i]
      const weekVal = parseFloat(String(row[0] || ''))

      if (isNaN(weekVal) || weekVal < 1 || weekVal > 40) continue

      const weekNum = Math.floor(weekVal)

      // Get Saturday date from col[7] (H column, index 7)
      const saturdayRaw = String(row[7] || '').trim()

      if (saturdayRaw && saturdayRaw.match(/\d+月\d+日/)) {
        // Saturday date is in "MM月DD日" format
        const saturday = parseChineseDate(saturdayRaw, baseYear)
        if (saturday) {
          // Calculate Monday from Saturday - 6 days
          const sat = new Date(saturday + 'T00:00:00')
          const mon = new Date(sat)
          mon.setDate(mon.getDate() - 6)
          const sun = new Date(sat)

          teachingWeeks.push({
            weekNumber: weekNum,
            startDate: toISO(mon),
            endDate: toISO(sun),
          })
          continue
        }
      }

      // Fallback: use numeric day values
      const monDay = parseInt(String(row[2] || ''))
      const satDay = parseInt(String(row[7] || ''))

      if (!isNaN(monDay) && !isNaN(satDay) && monDay > 0 && monDay <= 31) {
        const month = weekToMonth(weekNum)
        teachingWeeks.push({
          weekNumber: weekNum,
          startDate: toISO(new Date(baseYear, month - 1, monDay)),
          endDate: toISO(new Date(baseYear, month - 1, satDay)),
        })
      }
    }

    if (teachingWeeks.length === 0) {
      return { success: false, errors: ['未能解析出任何教学周'] }
    }

    console.log('[Parser] Parsed', teachingWeeks.length, 'weeks')
    for (let i = 0; i < Math.min(3, teachingWeeks.length); i++) {
      console.log(`  W${teachingWeeks[i].weekNumber}: ${teachingWeeks[i].startDate} ~ ${teachingWeeks[i].endDate}`)
    }
    if (teachingWeeks.length > 3) {
      const last = teachingWeeks[teachingWeeks.length - 1]
      console.log(`  W${last.weekNumber}: ${last.startDate} ~ ${last.endDate}`)
    }

    const calendar: TeachingCalendar = {
      id: crypto.randomUUID(),
      semester: title,
      teachingWeeks,
    }

    return {
      success: true,
      data: calendar,
      errors: []
    }
  } catch (err) {
    console.error('[Parser] Error:', err)
    return {
      success: false,
      errors: [`解析失败: ${err instanceof Error ? err.message : String(err)}`]
    }
  }
}

function inferYear(title: string): number {
  const m = title.match(/(\d{4})-(\d{4})/)
  if (m) return parseInt(m[2])
  return new Date().getFullYear()
}

function parseChineseDate(value: string, baseYear: number): string | null {
  const m = value.match(/(\d{1,2})月(\d{1,2})日/)
  if (!m) return null
  return toISO(new Date(baseYear, parseInt(m[1]) - 1, parseInt(m[2])))
}

function weekToMonth(week: number): number {
  if (week <= 4) return 3
  if (week <= 8) return 4
  if (week <= 13) return 5
  if (week <= 17) return 6
  if (week <= 21) return 7
  return 8
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
