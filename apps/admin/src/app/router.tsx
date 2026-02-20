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

const LoginPage = lazy(() => import('../features/auth/LoginPage'))
const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'))
const Categories = lazy(() => import('../features/categories/CategoriesPage'))
const Tags = lazy(() => import('../features/tags/TagsPage'))
const Articles = lazy(() => import('../features/articles/ArticlesPage'))
const Users = lazy(() => import('../features/users/UsersPage'))
const Comments = lazy(() => import('../features/comments/CommentsPage'))
const Settings = lazy(() => import('../features/settings/SettingsPage'))
const AboutBlocks = lazy(() => import('../features/about-blocks/AboutBlocksPage'))
const Media = lazy(() => import('../features/media/MediaPage'))

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<Spin size="large" style={{ display: 'block', margin: '48px auto' }} />}>{children}</Suspense>
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Lazy>
        <LoginPage />
      </Lazy>
    ),
    errorElement: <RouteErrorBoundary />,
  },
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
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
