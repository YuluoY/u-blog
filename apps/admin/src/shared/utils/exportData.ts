import { saveAs } from 'file-saver'

/**
 * 将数据导出为 JSON 文件并触发下载
 * @param data - 要导出的数据（数组或对象）
 * @param filename - 文件名（不含扩展名）
 */
export function exportToJSON(data: unknown, filename: string): void {
  try {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    saveAs(blob, `${filename}.json`)
  } catch (e) {
    console.error('[exportToJSON] 导出失败:', e)
  }
}

/**
 * 将二维数据导出为 CSV 文件并触发下载
 * @param rows - 数据行数组
 * @param columns - 列配置，key 为字段名，label 为表头显示名
 * @param filename - 文件名（不含扩展名）
 */
export function exportToCSV(
  rows: Record<string, unknown>[],
  columns: { key: string; label: string }[],
  filename: string,
): void {
  try {
    const BOM = '\uFEFF' // UTF-8 BOM，确保 Excel 正确识别中文
    const header = columns.map((c) => escapeCsvField(String(c.label))).join(',')
    const body = rows.map((row) =>
      columns.map((c) => escapeCsvField(formatCellValue(row[c.key]))).join(','),
    )
    const csv = [header, ...body].join('\n')
    const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `${filename}.csv`)
  } catch (e) {
    console.error('[exportToCSV] 导出失败:', e)
  }
}

/** 转义 CSV 字段：包含逗号、换行或双引号时用双引号包裹 */
function escapeCsvField(value: string): string {
  if (/[,"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** 将单元格值转为字符串表示 */
function formatCellValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
