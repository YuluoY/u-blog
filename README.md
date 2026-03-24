# U Blog Monorepo

这是一个基于 pnpm workspace 的 monorepo 项目，包含博客系统的前端、管理后台、后端服务以及共享的 UI 组件库和工具库。

## 🏗️ 项目结构

```
u-blog/
├── apps/                      # 应用项目
│   ├── frontend/             # 前端应用 (Vue 3 + TypeScript)
│   ├── admin/                # 管理后台 (React + TypeScript)
│   └── backend/              # 后端服务 (Express + JavaScript)
├── packages/                  # 共享包
│   ├── ui/                   # UI 组件库 (Vue 3)
│   └── utils/                # 工具库 (TypeScript)
├── tsconfig.base.json        # TypeScript 基础配置
├── tsconfig.json             # TypeScript 项目引用配置
├── pnpm-workspace.yaml       # pnpm workspace 配置
└── package.json              # 根 package.json
```

## 📦 子项目说明

### Apps

#### 🎨 Frontend (`@u-blog/frontend`)
- **技术栈**: Vue 3 + TypeScript + Vite
- **端口**: 默认 5173
- **说明**: 博客前端展示应用
- **依赖**: u-ui, vue, vue-router, pinia

#### 🔧 Admin (`@u-blog/admin`)
- **技术栈**: React + TypeScript + Vite
- **端口**: 默认 5174
- **说明**: 博客管理后台
- **依赖**: react, react-dom

#### 🚀 Backend (`@u-blog/backend`)
- **技术栈**: Express + JavaScript
- **端口**: 默认 3000
- **说明**: 后端 API 服务
- **依赖**: express, pg, jsonwebtoken

### Packages

#### 🎭 UI (`u-ui`)
- **说明**: Vue 3 UI 组件库
- **技术栈**: Vue 3 + TypeScript + Vite
- **包含**: 多个可复用的 UI 组件

#### 🛠️ Utils (`u-utils`)
- **说明**: 通用工具库
- **技术栈**: TypeScript + tsup
- **包含**: 核心工具、请求封装、存储管理等

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.0
- pnpm >= 8.0.0

### 安装依赖

```bash
# 安装 pnpm (如果还没有安装)
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 开发模式

```bash
# 启动所有应用
pnpm dev

# 启动特定应用
pnpm dev:frontend    # 启动前端
pnpm dev:admin       # 启动管理后台
pnpm dev:backend     # 启动后端服务
```

### 构建

```bash
# 构建所有项目
pnpm build

# 构建共享包
pnpm build:packages

# 构建应用
pnpm build:apps

# 构建特定应用
pnpm build:frontend
pnpm build:admin
pnpm build:backend
```

## 📝 开发指南

### 依赖管理

本项目使用 **依赖提升策略**，常用的第三方依赖在根目录统一管理：

**根目录统一管理的依赖：**
- `typescript` - TypeScript 编译器
- `vue` - Vue 3 框架
- `react`, `react-dom` - React 框架
- `axios` - HTTP 客户端
- `lodash-es` - 工具库
- `vite` - 构建工具
- `eslint` - 代码检查
- `sass` - CSS 预处理器

**添加依赖的方式：**

```bash
# 为特定子项目添加依赖
pnpm --filter @ucc-blog/frontend add package-name

# 为根项目添加共享的开发依赖
pnpm add -Dw package-name

# 为所有项目添加依赖
pnpm add -r package-name
```

### TypeScript 配置

项目使用统一的 TypeScript 配置：

- `tsconfig.base.json` - 基础配置，所有子项目继承
- `tsconfig.json` - 项目引用配置，用于 `tsc --build`
- 每个子项目都有自己的 `tsconfig.json`，继承基础配置

**类型检查：**

```bash
# 检查所有项目
pnpm typecheck

# 单独检查某个项目
pnpm --filter @ucc-blog/frontend typecheck
```

### 代码规范

```bash
# 检查所有项目的代码规范
pnpm lint

# 自动修复代码规范问题
pnpm lint:fix
```

### 测试

```bash
# 运行所有测试
pnpm test

# 监听模式运行测试
pnpm test:watch
```

## 🔧 工作区特性

### Workspace 协议

使用 `workspace:*` 协议引用内部包：

```json
{
  "dependencies": {
    "ucc-ui": "workspace:*",
    "ucc-utils": "workspace:*"
  }
}
```

### 版本管理

使用 Changesets 进行版本管理：

```bash
# 创建 changeset
pnpm changeset

# 更新版本号
pnpm version-packages

# 发布到 npm
pnpm release
```

## � Docker 一键部署

适用于全新服务器部署，所有服务（PostgreSQL、Redis、Backend、Frontend、Admin、Nginx）均运行在 Docker 容器中。

### 前置要求

- Docker >= 20 + Docker Compose V2
- 服务器 80/8080 端口可用

### 部署步骤

```bash
# 1. 克隆项目
git clone <repo-url> /var/www/u-blog && cd /var/www/u-blog

# 2. 创建环境配置
cp .env.example .env
# 编辑 .env，填入数据库密码、JWT 密钥、域名等必填项
nano .env

# 3. 一键启动
docker compose up -d
```

首次启动会自动构建镜像（约 10 分钟），后续更新只需：

```bash
docker compose build && docker compose up -d
```

### 环境配置说明

| 文件 | 用途 | 是否提交到 Git |
|------|------|---------------|
| `.env.example` | 部署模板（含注释说明） | ✅ |
| `.env` | Docker Compose 实际读取的配置 | ❌ |
| `.env.development` | 本地开发配置 | ✅ |

### 从 PM2 迁移到 Docker

如果当前使用 PM2 + 宿主机数据库，参考 `scripts/migrate-to-docker.sh` 完成数据迁移。

## �📂 技术栈总览

| 项目 | 框架 | 语言 | 构建工具 | UI 库 |
|------|------|------|----------|-------|
| Frontend | Vue 3 | TypeScript | Vite | ucc-ui |
| Admin | React | TypeScript | Vite | - |
| Backend | Express | JavaScript | - | - |
| UI | Vue 3 | TypeScript | Vite | - |
| Utils | - | TypeScript | tsup | - |

## 🤝 提交规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关
- `ci`: CI 配置
- `build`: 构建系统
- `revert`: 回滚

## 📄 License

MIT

## 👤 作者

Yuluo

