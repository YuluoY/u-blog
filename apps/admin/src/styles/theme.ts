import type { ThemeConfig } from 'antd'

/**
 * Ant Design 设计令牌：统一主色、圆角、字体等，便于品牌与主题扩展
 */
export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Button: {
      controlHeight: 36,
    },
    Input: {
      controlHeight: 36,
    },
  },
}
