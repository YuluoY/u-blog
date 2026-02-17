# Admin 技术栈与读源码指南

本文说明 `apps/admin` 的技术选型、目录约定以及如何通过读源码学习 React 与生态。

## 技术选型

| 层级 | 选型 | 说明 |
|------|------|------|
| 服务端状态 | TanStack Query (React Query) | 列表/详情用 `useQuery`，增删改用 `useMutation` + `invalidateQueries`；与客户端状态分离 |
| 客户端全局状态 | Context（Auth） | 仅登录/UI 等少量全局状态 |
| 路由 | React Router v7 | Layout 组合、ProtectedRoute、集中配置在 `app/router.tsx` |
| UI 组件 | Ant Design | Table/Form/Modal 等；主题通过 Design Token 配置 |
| 样式 | Ant Design Token + Tailwind CSS | 主题在 `styles/theme.ts`；Tailwind 做布局与工具类 |
| 请求 | Axios | 封装在 `shared/api`；拦截器统一错误与 401 跳转登录 |
| 类型 | TypeScript | API 响应类型、DTO 与后端一致 |
| 错误边界 | ErrorBoundary | 组件树错误捕获与降级 UI、重试 |
| 代码分割 | React.lazy + Suspense | 按路由拆分 chunk，首屏与按需加载 |

## 目录约定

```
apps/admin/src/
├── app/                 # 应用壳
│   ├── App.tsx
│   ├── router.tsx       # 路由集中、lazy 引入
│   └── providers.tsx    # QueryClient + ConfigProvider + AuthProvider
├── features/            # 按功能域
│   ├── auth/            # 登录、鉴权、ProtectedRoute
│   ├── dashboard/       # 仪表盘、useDashboardStats
│   ├── categories/      # 分类 CRUD（模板：useQuery + useMutation + Table/Modal）
│   └── ...
├── layouts/
│   └── AdminLayout.tsx
├── shared/
│   ├── api/             # axios 实例、rest 封装、类型
│   ├── hooks/           # 通用 hooks（可选）
│   └── components/      # 如 ErrorBoundary
├── styles/
│   ├── theme.ts         # antd token
│   └── index.css        # Tailwind 入口
└── main.tsx
```

- 每个 feature 内：`api.ts`、`useXxx.ts`（useQuery/useMutation）、页面与表格/弹窗组件。
- 服务端数据一律走 TanStack Query，不放在 Context/useState。
- 新 CRUD 模块可复制 `features/categories` 再改 api/columns/表单字段。

## 服务端状态（React Query）

- **查询**：在 feature 的 `useXxx.ts` 里用 `useQuery`，`queryKey` 与请求参数一致（如 `['categories', pagination]`）。
- **变更**：用 `useMutation`，成功后 `queryClient.invalidateQueries({ queryKey })` 使列表/统计自动刷新。
- 阅读重点：`features/dashboard/useDashboardStats.ts`、`features/categories/useCategories.ts` 与 `useCategoryMutations.ts`。

## 客户端状态与 401

- 登录态在 `features/auth/AuthContext.tsx`，通过 `useAuth()` 获取 `user`、`login`、`logout`。
- `shared/api/client.ts` 的响应拦截器在 401 时调用 `setOnUnauthorized`；`app/providers.tsx` 内注册为「登出 + 跳转登录页」。

## 路由与懒加载

- 路由表在 `app/router.tsx`，使用 `createBrowserRouter` + `RouterProvider`。
- 页面组件均通过 `React.lazy` 引入，根层用 `Suspense` 包一层，fallback 为 `<Spin />`。
- 阅读重点：`app/router.tsx` 中 lazy 与 Lazy 包装方式。

## 错误边界与主题

- `shared/components/ErrorBoundary.tsx` 捕获子树错误，展示 Result + 重试按钮；在 `App.tsx` 包住 `AppRouter`。
- 主题：`styles/theme.ts` 导出 antd `ThemeConfig`，在 `app/providers.tsx` 的 `ConfigProvider` 中传入。

## 推荐阅读顺序

1. `app/providers.tsx`：QueryClient、ConfigProvider、Auth、401 注册。
2. `app/router.tsx`：路由与 lazy。
3. `shared/api/client.ts`、`rest.ts`：请求封装与拦截器。
4. `features/auth`：登录、ProtectedRoute、useAuth。
5. `features/dashboard`：useDashboardStats（useQuery）、DashboardPage。
6. `features/categories`：useCategories、useCategoryMutations、Table + Modal 表单 + Popconfirm 删除（作为其他 CRUD 模板）。

按上述顺序阅读，可系统理解「服务端状态用 React Query、客户端状态用 Context、按功能划分目录、错误边界与按需加载」的用法。
