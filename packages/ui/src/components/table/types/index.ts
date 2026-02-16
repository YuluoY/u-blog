export interface UTableColumn<T = any> {
  /** 列字段名，对应 data 中键 */
  prop: string
  /** 列标题 */
  label: string
  /** 列宽度 */
  width?: string | number
  /** 对齐 */
  align?: 'left' | 'center' | 'right'
  /** 自定义渲染 */
  formatter?: (row: T, column: UTableColumn<T>, value: any) => any
}

export interface UTableProps<T = any> {
  /** 表格数据 */
  data?: T[]
  /** 列配置 */
  columns?: UTableColumn<T>[]
  /** 是否显示斑马纹 */
  stripe?: boolean
  /** 是否显示边框 */
  border?: boolean
}
