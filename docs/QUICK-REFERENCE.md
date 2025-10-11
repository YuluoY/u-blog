# 快速参考

本文档提供 UCC Blog Monorepo 的常用命令和配置速查表。

## 📋 目录

- [常用命令](#常用命令)
- [项目结构速查](#项目结构速查)
- [依赖管理](#依赖管理)
- [构建和部署](#构建和部署)
- [故障排除](#故障排除)

## 常用命令

### 开发

```bash
# 启动所有应用
pnpm dev

# 启动单个应用
pnpm dev:frontend    # Vue 前端 (端口 5173)
pnpm dev:admin       # React 管理后台 (端口 5174)
pnpm dev:backend     # Express 后端 (端口 3000)
```

### 构建

```bash
# 构建所有项目
pnpm build

# 构建共享包
pnpm build:packages

# 构建应用
pnpm build:apps

# 构建单个项目
pnpm build:frontend
pnpm build:admin
pnpm build:backend
```

### 代码质量

```bash
# ESLint 检查
pnpm lint
pnpm lint:fix

# TypeScript 类型检查
pnpm typecheck

# 运行测试
pnpm test
pnpm test:watch
```

### 依赖管理

```bash
# 安装所有依赖
pnpm install

# 更新依赖
pnpm up -i                    # 交互式更新
pnpm up -r --latest          # 更新到最新版本

# 添加依赖
pnpm add -Dw <package>                          # 添加到根项目
pnpm --filter @ucc-blog/frontend add <package>  # 添加到 frontend
pnpm --filter @ucc-blog/admin add <package>     # 添加到 admin
pnpm --filter @ucc-blog/backend add <package>   # 添加到 backend
```

### 清理

```bash
# 清理构建产物
pnpm clean

# 清理所有 node_modules
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# 清理 TypeScript 缓存
find . -name "*.tsbuildinfo" -delete

# 清理并重新安装
pnpm clean && rm -rf node_modules && pnpm install
```

## 项目结构速查

```
ucc-blog/
├── apps/
│   ├── frontend/          # Vue 3 前端 (端口: 5173)
│   ├── admin/             # React 管理后台 (端口: 5174)
│   └── backend/           # Express 后端 (端口: 3000)
├── packages/
│   ├── ui/                # Vue 3 UI 组件库
│   └── utils/             # TypeScript 工具库
├── docs/                  # 文档
├── tsconfig.base.json    # TS 基础配置
├── tsconfig.json         # TS 项目引用
└── package.json          # 根配置
```

## 依赖管理

### 根目录统一管理的依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `vue` | ^3.5.22 | Frontend + UI |
| `react` | ^18.2.0 | Admin |
| `react-dom` | ^18.2.0 | Admin |
| `typescript` | ^5.5.4 | 全局 |
| `vite` | ^5.2.6 | 构建工具 |
| `axios` | ^1.7.2 | HTTP 客户端 |
| `lodash-es` | ^4.17.21 | 工具库 |
| `sass` | ^1.72.0 | CSS 预处理 |
| `eslint` | ^8.57.0 | 代码检查 |

### Workspace 引用

```json
{
  "dependencies": {
    "vue": "workspace:*",           // 引用根依赖
    "react": "workspace:*",         // 引用根依赖
    "ucc-ui": "workspace:*",        // 引用内部包
    "ucc-utils": "workspace:*"      // 引用内部包
  }
}
```

## 构建和部署

### 构建流程

```bash
# 1. 安装依赖
pnpm install

# 2. 构建 packages (必须先构建)
pnpm build:packages

# 3. 构建 apps
pnpm build:apps

# 或一步完成
pnpm build
```

### 构建产物

| 项目 | 输出目录 | 类型 |
|------|----------|------|
| Frontend | `apps/frontend/dist` | 静态资源 |
| Admin | `apps/admin/dist` | 静态资源 |
| Backend | - | 源代码直接运行 |
| UI | `packages/ui/packages/components/dist` | ES Module |
| Utils | `packages/utils/dist` | CJS + ESM |

### 环境变量

**Frontend & Admin:**
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000

# .env.production
VITE_API_BASE_URL=https://api.yourdomain.com
```

**Backend:**
```bash
# .env
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
```

## 故障排除

### 问题：依赖安装失败

```bash
# 方案 1: 清理 pnpm 缓存
pnpm store prune
pnpm install

# 方案 2: 完全清理
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 方案 3: 强制重新安装
pnpm install --force
```

### 问题：TypeScript 类型错误

```bash
# 清理 TS 缓存
find . -name "*.tsbuildinfo" -delete

# 重新进行类型检查
pnpm typecheck

# 重新构建
pnpm build:packages
```

### 问题：Workspace 链接不工作

```bash
# 检查 workspace 包
pnpm list -r --depth -1

# 重新链接
pnpm install --force

# 重新构建共享包
pnpm build:packages
```

### 问题：端口已被占用

```bash
# 查找占用端口的进程
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5173
kill -9 <PID>

# 或在 vite.config.ts 中修改端口
server: {
  port: 5175  // 使用其他端口
}
```

### 问题：Vite HMR 不工作

```bash
# 1. 清理 Vite 缓存
rm -rf node_modules/.vite

# 2. 使用 --force 启动
pnpm dev --force

# 3. 检查 vite.config.ts 中的配置
server: {
  watch: {
    usePolling: true  // WSL 或虚拟机环境
  }
}
```

### 问题：构建内存溢出

```bash
# 增加 Node.js 内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm build

# 或在 package.json 中设置
{
  "scripts": {
    "build": "NODE_OPTIONS=--max-old-space-size=4096 vite build"
  }
}
```

## 性能优化技巧

### 1. 加快依赖安装

```bash
# 使用国内镜像
pnpm config set registry https://registry.npmmirror.com

# 或使用 .npmrc
registry=https://registry.npmmirror.com
```

### 2. 并行构建

```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter \"./apps/*\" dev"
  }
}
```

### 3. 跳过不必要的步骤

```bash
# 跳过 postinstall 脚本
pnpm install --ignore-scripts

# 跳过类型检查（仅开发）
pnpm dev --skip-typecheck
```

### 4. 使用 Vite 缓存

```typescript
// vite.config.ts
export default defineConfig({
  cacheDir: 'node_modules/.vite',
  optimizeDeps: {
    include: ['vue', 'axios', 'lodash-es']
  }
})
```

## 调试技巧

### 查看依赖信息

```bash
# 查看所有依赖
pnpm list -r

# 查看特定包的依赖
pnpm list axios

# 查看为什么安装了某个包
pnpm why axios

# 查看过期的包
pnpm outdated
```

### VSCode 调试配置

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/apps/frontend"
    },
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/backend/main.js",
      "cwd": "${workspaceFolder}/apps/backend"
    }
  ]
}
```

## Git 工作流

### Commit 规范

```bash
# 格式
<type>(<scope>): <subject>

# 示例
feat(frontend): 添加用户登录功能
fix(admin): 修复表格排序问题
docs(monorepo): 更新文档
chore(deps): 升级依赖版本
```

### 常用 Scope

- `frontend` - 前端应用
- `admin` - 管理后台
- `backend` - 后端服务
- `ui` - UI 组件库
- `utils` - 工具库
- `deps` - 依赖更新
- `config` - 配置修改
- `monorepo` - Monorepo 整体

## 版本发布

```bash
# 1. 创建 changeset
pnpm changeset

# 2. 更新版本号
pnpm version-packages

# 3. 提交更新
git add .
git commit -m "chore: version packages"

# 4. 发布（仅维护者）
pnpm release
```

## 有用的别名

在 `~/.bashrc` 或 `~/.zshrc` 中添加：

```bash
# pnpm 别名
alias pi="pnpm install"
alias pd="pnpm dev"
alias pb="pnpm build"
alias pt="pnpm test"
alias pl="pnpm lint"

# UCC Blog 特定
alias udf="pnpm dev:frontend"
alias uda="pnpm dev:admin"
alias udb="pnpm dev:backend"
alias ubp="pnpm build:packages"
```

## 相关链接

- [README.md](../README.md) - 项目概览
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 贡献指南
- [MONOREPO-GUIDE.md](./MONOREPO-GUIDE.md) - Monorepo 架构详解
- [pnpm 文档](https://pnpm.io/)
- [Vite 文档](https://vitejs.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)

