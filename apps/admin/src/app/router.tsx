import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useRouteError } from 'react-router-dom'
import { Button, Result, Spin } from 'antd'
import ProtectedRoute from '../features/auth/ProtectedRoute'
import AdminLayout from '../layouts/AdminLayout'

/** 路由级错误展示，避免白屏 */
function RouteErrorBoundary() {
  const error = useRouteError() as Error
  return (
    <Result
      status="error"
      title="页面出错"
      subTitle={error?.message ?? '未知错误'}
      extra={
        <Button type="primary" onClick={() => window.location.reload()}>
          刷新页面
        </Button>
      }
    />
  )
}

const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'))
const Categories = lazy(() => import('../features/categories/CategoriesPage'))
const Tags = lazy(() => import('../features/tags/TagsPage'))
const Articles = lazy(() => import('../features/articles/ArticlesPage'))
const Users = lazy(() => import('../features/users/UsersPage'))
const Comments = lazy(() => import('../features/comments/CommentsPage'))
const Settings = lazy(() => import('../features/settings/SettingsPage'))
const AboutBlocks = lazy(() => import('../features/about-blocks/AboutBlocksPage'))
const Media = lazy(() => import('../features/media/MediaPage'))
const Analytics = lazy(() => import('../features/analytics/AnalyticsPage'))
const FriendLinks = lazy(() => import('../features/friend-links/FriendLinksPage'))
const Roles = lazy(() => import('../features/roles/RolesPage'))
const Permissions = lazy(() => import('../features/permissions/PermissionsPage'))
const Routes = lazy(() => import('../features/routes/RoutesPage'))
const Xiaohui = lazy(() => import('../features/xiaohui/XiaohuiPage'))
const System = lazy(() => import('../features/system/SystemPage'))
const CrawlerMonitor = lazy(() => import('../features/crawler-monitor/CrawlerMonitorPage'))
const Likes = lazy(() => import('../features/likes/LikesPage'))
const Views = lazy(() => import('../features/views/ViewsPage'))
const Subscribers = lazy(() => import('../features/subscribers/SubscribersPage'))
const Announcements = lazy(() => import('../features/announcements/AnnouncementsPage'))

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Spin size="large" style={{ display: 'block', margin: '48px auto' }} />}>{children}</Suspense>
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Lazy><DashboardPage /></Lazy> },
      { path: 'articles', element: <Lazy><Articles /></Lazy> },
      { path: 'users', element: <Lazy><Users /></Lazy> },
      { path: 'categories', element: <Lazy><Categories /></Lazy> },
      { path: 'tags', element: <Lazy><Tags /></Lazy> },
      { path: 'comments', element: <Lazy><Comments /></Lazy> },
      { path: 'media', element: <Lazy><Media /></Lazy> },
      { path: 'settings', element: <Lazy><Settings /></Lazy> },
      { path: 'about-blocks', element: <Lazy><AboutBlocks /></Lazy> },
      { path: 'analytics', element: <Lazy><Analytics /></Lazy> },
      { path: 'friend-links', element: <Lazy><FriendLinks /></Lazy> },
      { path: 'roles', element: <Lazy><Roles /></Lazy> },
      { path: 'permissions', element: <Lazy><Permissions /></Lazy> },
      { path: 'routes', element: <Lazy><Routes /></Lazy> },
      { path: 'xiaohui', element: <Lazy><Xiaohui /></Lazy> },
      { path: 'likes', element: <Lazy><Likes /></Lazy> },
      { path: 'views', element: <Lazy><Views /></Lazy> },
      { path: 'subscribers', element: <Lazy><Subscribers /></Lazy> },
      { path: 'announcements', element: <Lazy><Announcements /></Lazy> },
      { path: 'seo-monitor', element: <Lazy><CrawlerMonitor /></Lazy> },
      { path: 'crawler-monitor', element: <Navigate to="/seo-monitor" replace /> },
      { path: 'system', element: <Lazy><System /></Lazy> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
], { basename })

export function AppRouter() {
  return <RouterProvider router={router} />
}
