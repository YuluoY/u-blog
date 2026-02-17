import { useState, useMemo } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { Layout, Menu, Button, Select, Space } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  FileTextOutlined,
  UserOutlined,
  FolderOutlined,
  TagsOutlined,
  CommentOutlined,
  PictureOutlined,
  SettingOutlined,
  ReadOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  GlobalOutlined,
  BulbOutlined,
  MoonOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../features/auth/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { setStoredLang, type Lang } from '../app/i18n'
import i18n from '../app/i18n'

const { Header, Sider, Content } = Layout

const MENU_KEYS = [
  '/dashboard',
  '/articles',
  '/users',
  '/categories',
  '/tags',
  '/comments',
  '/media',
  '/settings',
  '/about-blocks',
] as const
const MENU_ICONS = [
  DashboardOutlined,
  FileTextOutlined,
  UserOutlined,
  FolderOutlined,
  TagsOutlined,
  CommentOutlined,
  PictureOutlined,
  SettingOutlined,
  ReadOutlined,
]
const MENU_TRANSLATION_KEYS = [
  'menu.dashboard',
  'menu.articles',
  'menu.users',
  'menu.categories',
  'menu.tags',
  'menu.comments',
  'menu.media',
  'menu.settings',
  'menu.aboutBlocks',
] as const

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const { themeMode, toggleThemeWithTransition } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems: MenuProps['items'] = useMemo(() => {
    return MENU_KEYS.map((key, i) => {
      const Icon = MENU_ICONS[i]
      return {
        key,
        icon: Icon ? <Icon /> : null,
        label: t(MENU_TRANSLATION_KEYS[i]),
      }
    })
  }, [t])

  const handleMenuSelect = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const langOptions = [
    { value: 'zh', label: t('lang.zh') },
    { value: 'en', label: t('lang.en') },
  ]

  const handleLangChange = (value: Lang) => {
    setStoredLang(value)
    i18n.changeLanguage(value)
  }

  return (
    <Layout className="admin-layout-root">
      <Sider trigger={null} collapsible collapsed={collapsed} theme={themeMode === 'dark' ? 'dark' : 'light'}>
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            paddingLeft: collapsed ? 0 : 16,
            color: themeMode === 'dark' ? '#fff' : 'rgba(0,0,0,0.88)',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {collapsed ? t('app.titleShort') : t('app.title')}
        </div>
        <Menu
          theme={themeMode === 'dark' ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onSelect={handleMenuSelect}
        />
      </Sider>
      <Layout className="admin-layout-right">
        <Header className="admin-layout-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: 16 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Space size="middle">
              <Select
                size="small"
                value={i18n.language as Lang}
                onChange={handleLangChange}
                options={langOptions}
                style={{ width: 100 }}
                suffixIcon={<GlobalOutlined />}
                optionLabelProp="label"
              />
              <Button
                type="text"
                size="small"
                icon={themeMode === 'dark' ? <MoonOutlined /> : <BulbOutlined />}
                onClick={(e) => toggleThemeWithTransition(e)}
                title={themeMode === 'dark' ? t('theme.dark') : t('theme.light')}
                data-testid="theme-toggle"
              >
                {themeMode === 'dark' ? t('theme.dark') : t('theme.light')}
              </Button>
            </Space>
            <span className="admin-header-meta">
              {user?.namec || user?.username || t('common.admin')}
            </span>
            <Button type="primary" danger size="small" icon={<LogoutOutlined />} onClick={handleLogout}>
              {t('common.logout')}
            </Button>
          </div>
        </Header>
        <Content className="admin-layout-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
