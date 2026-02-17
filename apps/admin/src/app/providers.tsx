import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { AuthProvider, useAuth } from '../features/auth/AuthContext'
import { ThemeProvider, useTheme } from '../contexts/ThemeContext'
import { setMessageInstance, setOnUnauthorized } from '../shared/api/client'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
})

/** 同步 dayjs 与 i18n 语言 */
function DayjsLocaleSync() {
  const { i18n } = useTranslation()
  useEffect(() => {
    dayjs.locale(i18n.language === 'en' ? 'en' : 'zh-cn')
  }, [i18n.language])
  return null
}

/** 根据 i18n 与 Theme 提供 ConfigProvider */
function AntdConfigBridge({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const { themeConfig } = useTheme()
  const locale = i18n.language === 'en' ? enUS : zhCN
  return (
    <ConfigProvider locale={locale} theme={themeConfig}>
      <DayjsLocaleSync />
      {children}
    </ConfigProvider>
  )
}

function Auth401Setup() {
  const { logout } = useAuth()
  useEffect(() => {
    setOnUnauthorized(() => {
      logout()
      window.location.href = '/login'
    })
    return () => setOnUnauthorized(null)
  }, [logout])
  return null
}

function MessageRefSetup() {
  const { message } = AntdApp.useApp()
  useEffect(() => {
    setMessageInstance(message)
    return () => setMessageInstance(null)
  }, [message])
  return null
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AntdConfigBridge>
          <AntdApp>
            <MessageRefSetup />
            <AuthProvider>
              <Auth401Setup />
              {children}
            </AuthProvider>
          </AntdApp>
        </AntdConfigBridge>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
