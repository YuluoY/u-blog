import { useState, useMemo, useEffect } from 'react'
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
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  GlobalOutlined,
  BulbOutlined,
  MoonOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  NodeIndexOutlined,
  RobotOutlined,
  ControlOutlined,
  EditOutlined,
  TeamOutlined,
  LockOutlined,
  ToolOutlined,
  LikeOutlined,
  EyeOutlined,
  MailOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuth, FRONTEND_LOGIN_URL } from '../features/auth/AuthContext'
import { useGuestMode } from '../contexts/GuestModeContext'
import { useTheme } from '../contexts/ThemeContext'
import { setStoredLang, type Lang } from '../app/i18n'
import i18n from '../app/i18n'
import logoSvg from '../assets/logo.svg'

const { Header, Sider, Content } = Layout

/**
 * 菜单分组结构定义
 * 按业务逻辑分为：仪表盘（独立）、内容管理、互动、权限管理、系统
 */
interface MenuGroupDef {
  groupKey: string
  groupIcon: typeof DashboardOutlined
  groupLabel: string
  children: { key: string; icon: typeof DashboardOutlined; label: string }[]
}

/** 构建分组菜单配置（需要 t 函数） */
function buildMenuConfig(t: (key: string) => string): {
  standalone: { key: string; icon: typeof DashboardOutlined; label: string }[]
  groups: MenuGroupDef[]
} {
  return {
    standalone: [
      { key: '/dashboard', icon: DashboardOutlined, label: t('menu.dashboard') },
    ],
    groups: [
      {
        groupKey: 'content',
        groupIcon: EditOutlined,
        groupLabel: t('menu.group.content'),
        children: [
          { key: '/articles', icon: FileTextOutlined, label: t('menu.articles') },
          { key: '/categories', icon: FolderOutlined, label: t('menu.categories') },
          { key: '/tags', icon: TagsOutlined, label: t('menu.tags') },
          { key: '/media', icon: PictureOutlined, label: t('menu.media') },
          { key: '/about-blocks', icon: ReadOutlined, label: t('menu.aboutBlocks') },
          { key: '/likes', icon: LikeOutlined, label: t('menu.likes') },
          { key: '/views', icon: EyeOutlined, label: t('menu.views') },
        ],
      },
      {
        groupKey: 'interact',
        groupIcon: TeamOutlined,
        groupLabel: t('menu.group.interact'),
        children: [
          { key: '/comments', icon: CommentOutlined, label: t('menu.comments') },
          { key: '/friend-links', icon: LinkOutlined, label: t('menu.friendLinks') },
          { key: '/subscribers', icon: MailOutlined, label: t('menu.subscribers') },
          { key: '/xiaohui', icon: RobotOutlined, label: t('menu.xiaohui') },
        ],
      },
      {
        groupKey: 'access',
        groupIcon: LockOutlined,
        groupLabel: t('menu.group.access'),
        children: [
          { key: '/users', icon: UserOutlined, label: t('menu.users') },
          { key: '/roles', icon: SafetyCertificateOutlined, label: t('menu.roles') },
          { key: '/permissions', icon: KeyOutlined, label: t('menu.permissions') },
          { key: '/routes', icon: NodeIndexOutlined, label: t('menu.routes') },
        ],
      },
      {
        groupKey: 'system',
        groupIcon: ToolOutlined,
        groupLabel: t('menu.group.system'),
        children: [
          { key: '/settings', icon: SettingOutlined, label: t('menu.settings') },
          { key: '/analytics', icon: BarChartOutlined, label: t('menu.analytics') },
          { key: '/system', icon: ControlOutlined, label: t('menu.system') },
        ],
      },
    ],
  }
}

/**
 * 角色/游客可见路径白名单
 * - guest：仅查看内容、互动和数据统计（只读）
 * - admin：除 roles/permissions/routes/system 外所有页面
 * - super_admin：全部页面
 */
const GUEST_ALLOWED_PATHS = new Set([
  '/dashboard',
  '/articles', '/categories', '/tags', '/media', '/about-blocks',
  '/likes', '/views',
  '/comments', '/friend-links', '/subscribers', '/xiaohui',
  '/analytics',
])

const ADMIN_HIDDEN_PATHS = new Set([
  '/roles', '/permissions', '/routes', '/system',
])

/** 根据角色判断某路径是否可见 */
function isPathVisible(path: string, role: string | undefined, isGuest: boolean): boolean {
  if (isGuest) return GUEST_ALLOWED_PATHS.has(path)
  if (role === 'admin') return !ADMIN_HIDDEN_PATHS.has(path)
  // super_admin 无限制
  return true
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { isGuest } = useGuestMode()
  const { t } = useTranslation()
  const { themeMode, toggleThemeWithTransition } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const userRole = user?.role

  /** 根据当前路径计算 openKeys（展开对应的分组） */
  const defaultOpenKeys = useMemo(() => {
    const cfg = buildMenuConfig(t)
    for (const g of cfg.groups) {
      if (g.children.some(c => c.key === location.pathname)) {
        return [g.groupKey]
      }
    }
    return []
  }, [location.pathname, t])

  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKeys)

  // 路径变化时自动展开对应分组
  useEffect(() => {
    setOpenKeys(prev => {
      const cfg = buildMenuConfig(t)
      for (const g of cfg.groups) {
        if (g.children.some(c => c.key === location.pathname) && !prev.includes(g.groupKey)) {
          return [...prev, g.groupKey]
        }
      }
      return prev
    })
  }, [location.pathname, t])

  // 游客/admin 访问无权路径时重定向到仪表盘
  useEffect(() => {
    if (!isPathVisible(location.pathname, userRole, isGuest) && location.pathname !== '/dashboard') {
      navigate('/dashboard', { replace: true })
    }
  }, [location.pathname, userRole, isGuest, navigate])

  const menuItems: MenuProps['items'] = useMemo(() => {
    const cfg = buildMenuConfig(t)
    const items: MenuProps['items'] = []

    // 独立菜单项（仪表盘）— 始终可见
    for (const item of cfg.standalone) {
      if (!isPathVisible(item.key, userRole, isGuest)) continue
      const Icon = item.icon
      items.push({ key: item.key, icon: <Icon />, label: item.label })
    }

    // 分组子菜单 — 按角色过滤子项，空分组不渲染
    for (const group of cfg.groups) {
      const visibleChildren = group.children.filter(c => isPathVisible(c.key, userRole, isGuest))
      if (visibleChildren.length === 0) continue

      const GroupIcon = group.groupIcon
      items.push({
        key: group.groupKey,
        icon: <GroupIcon />,
        label: group.groupLabel,
        children: visibleChildren.map(child => {
          const ChildIcon = child.icon
          return { key: child.key, icon: <ChildIcon />, label: child.label }
        }),
      })
    }

    return items
  }, [t, userRole, isGuest])

  const handleMenuSelect = ({ key }: { key: string }) => {
    navigate(key)
  }

  const handleLogout = () => {
    logout()
    // 登出后返回前端首页（不传 returnUrl，避免用户反复重定向）
    window.location.href = FRONTEND_LOGIN_URL.replace('/login', '')
  }

  const langOptions = [
    { value: 'zh', label: t('lang.zh') },
    { value: 'en', label: t('lang.en') },
  ]

  const handleLangChange = (value: Lang) => {
    setStoredLang(value)
    i18n.changeLanguage(value)
  }

  // 同步浏览器标签页标题
  useEffect(() => {
    document.title = t('app.title')
  }, [t])

  return (
    <Layout className="admin-layout-root">
      <Sider trigger={null} collapsible collapsed={collapsed} theme={themeMode === 'dark' ? 'dark' : 'light'} style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            paddingLeft: collapsed ? 0 : 16,
            gap: 10,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {/* 品牌 Logo */}
          <img
            src={logoSvg}
            alt="U-Blog"
            style={{ width: 28, height: 28, flexShrink: 0 }}
          />
          {/* 品牌名称（折叠时隐藏） */}
          {!collapsed && (
            <span
              style={{
                color: themeMode === 'dark' ? '#fff' : 'rgba(0,0,0,0.88)',
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: '-0.02em',
              }}
            >
              {t('app.title')}
            </span>
          )}
        </div>
        <Menu
          theme={themeMode === 'dark' ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={openKeys}
          onOpenChange={setOpenKeys}
          items={menuItems}
          onSelect={handleMenuSelect}
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
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
              {isGuest ? t('common.guest') : (user?.namec || user?.username || t('common.admin'))}
            </span>
            {!isGuest && (
              <Button type="primary" danger size="small" icon={<LogoutOutlined />} onClick={handleLogout}>
                {t('common.logout')}
              </Button>
            )}
          </div>
        </Header>
        <Content className="admin-layout-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
