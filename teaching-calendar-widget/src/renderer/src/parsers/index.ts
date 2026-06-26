import type { ParseResult } from '@shared/types'
import { parseXlsFile } from './xlsParser'
import { parseTimeSlotsFile, parseClassScheduleFile } from './scheduleParser'

/**
 * 解析教学日历文件 (xls/xlsx)
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase()
  const buffer = await file.arrayBuffer()

  switch (ext) {
    case 'xls':
    case 'xlsx':
      return parseXlsFile(buffer)
    default:
      return {
        success: false,
        errors: [`暂不支持 .${ext} 格式，当前支持: xls, xlsx`]
      }
  }
}

export { parseTimeSlotsFile, parseClassScheduleFile }
