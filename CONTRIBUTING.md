# 贡献指南

感谢您对 UCC Blog 项目的关注！本文档将帮助您了解如何为项目做出贡献。

## 开发环境设置

### 1. 前置要求

确保您的开发环境满足以下要求：

- **Node.js**: >= 20.19.0 (推荐使用 nvm 管理 Node 版本)
- **pnpm**: >= 8.0.0
- **Git**: 最新稳定版

### 2. 安装 pnpm

```bash
npm install -g pnpm
```

### 3. 克隆仓库

```bash
git clone https://github.com/your-org/ucc-blog.git
cd ucc-blog
```

### 4. 安装依赖

```bash
pnpm install
```

这将安装所有子项目的依赖，并建立内部包之间的链接。

## Monorepo 架构

### 依赖管理策略

本项目采用 **依赖提升 + Workspace 协议** 的混合策略：

#### 根目录统一管理（提升）

以下依赖在根目录 `package.json` 中统一管理：

**框架相关:**

- `vue`: Vue 3 框架（用于 frontend 和 ui）
- `react`, `react-dom`: React 框架（用于 admin）

**构建工具:**

- `vite`: 构建工具（所有前端项目共享）
- `typescript`: TypeScript 编译器
- `vitest`: 测试框架

**开发工具:**

- `eslint`: 代码检查
- `@vitejs/plugin-vue`: Vue Vite 插件
- `@vitejs/plugin-vue-jsx`: Vue JSX 插件
- `@vitejs/plugin-react-swc`: React SWC 插件

**通用库:**

- `axios`: HTTP 客户端
- `lodash-es`: 工具库
- `sass`: CSS 预处理器

#### 子项目特定依赖

只有子项目独有的依赖才保留在各自的 `package.json` 中：

- **Frontend**: `pinia`, `vue-router`, `md-editor-v3` 等
- **Admin**: React 生态的特定依赖
- **Backend**: `express`, `pg`, `jsonwebtoken` 等 Node.js 特定包

### 添加新依赖

```bash
# 添加到根项目（所有子项目共享）
pnpm add -Dw <package-name>

# 添加到特定子项目
pnpm --filter @ucc-blog/frontend add <package-name>

# 添加 workspace 内部包
pnpm --filter @ucc-blog/frontend add ucc-ui@workspace:*
```

## TypeScript 配置

### 配置层次结构

```
tsconfig.base.json          # 基础配置（所有项目继承）
├── apps/frontend/tsconfig.json     # Frontend 配置
├── apps/admin/tsconfig.json        # Admin 配置
├── packages/ui/tsconfig.json       # UI 包配置
└── packages/utils/tsconfig.json    # Utils 包配置
```

### 配置原则

1. **基础配置统一**: 所有 TypeScript 编译选项的默认值在 `tsconfig.base.json` 中定义
2. **项目特定覆盖**: 各子项目只覆盖必要的选项（如 `jsx`, `lib` 等）
3. **启用 composite**: 所有子项目都启用 `composite: true` 以支持项目引用
4. **类型检查**: 使用 `tsc --build` 进行增量构建

### 修改 TypeScript 配置

- **修改共享配置**: 编辑 `tsconfig.base.json`
- **修改项目特定配置**: 编辑对应项目的 `tsconfig.json`

## 开发工作流

### 1. 创建分支

```bash
git checkout -b feat/your-feature-name
```

### 2. 开发

```bash
# 启动所有应用开发服务器
pnpm dev

# 或者只启动特定应用
pnpm dev:frontend
pnpm dev:admin
pnpm dev:backend
```

### 3. 代码规范检查

```bash
# 检查代码风格
pnpm lint

# 自动修复
pnpm lint:fix

# TypeScript 类型检查
pnpm typecheck
```

### 4. 测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch
```

### 5. 提交代码

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```bash
git add .
git commit -m "feat: 添加新功能"
```

**提交类型:**

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动
- `ci`: CI 配置
- `build`: 构建系统
- `revert`: 回滚

**Scope 建议:**

- `frontend`: 前端应用相关
- `admin`: 管理后台相关
- `backend`: 后端服务相关
- `ui`: UI 组件库相关
- `utils`: 工具库相关
- `deps`: 依赖更新
- `config`: 配置文件修改

### 6. 推送和 PR

```bash
git push origin feat/your-feature-name
```

然后在 GitHub 上创建 Pull Request。

## 常见任务

### 添加新的共享包

1. 在 `packages/` 下创建新目录
2. 创建 `package.json`，name 使用 scoped name（如 `@ucc-blog/new-package`）
3. 创建 `tsconfig.json` 继承 `../../tsconfig.base.json`
4. 在根 `tsconfig.json` 中添加项目引用
5. 更新 `pnpm-workspace.yaml`（如果需要）

### 更新依赖版本

```bash
# 交互式更新
pnpm up -i

# 更新所有依赖到最新
pnpm up -r --latest

# 更新特定包
pnpm up -r <package-name>
```

### 清理和重装

```bash
# 清理构建产物
pnpm clean

# 清理 node_modules
rm -rf node_modules packages/*/node_modules apps/*/node_modules

# 重新安装
pnpm install
```

## 构建

```bash
# 构建所有项目（先构建 packages，再构建 apps）
pnpm build

# 只构建 packages
pnpm build:packages

# 只构建 apps
pnpm build:apps

# 构建特定项目
pnpm --filter @ucc-blog/frontend build
```

## 发布流程

本项目使用 [Changesets](https://github.com/changesets/changesets) 管理版本和发布：

```bash
# 1. 创建 changeset
pnpm changeset

# 2. 更新版本号
pnpm version-packages

# 3. 提交版本更新
git add .
git commit -m "chore: version packages"

# 4. 发布到 npm（仅维护者）
pnpm release
```

## 调试技巧

### 查看依赖树

```bash
# 查看特定包的依赖
pnpm list <package-name>

# 查看为什么安装了某个包
pnpm why <package-name>
```

### 检查 workspace 链接

```bash
# 列出所有 workspace 包
pnpm list -r --depth -1
```

### TypeScript 构建缓存

如果遇到类型问题，尝试清理 TypeScript 构建缓存：

```bash
# 清理所有 .tsbuildinfo 文件
find . -name "*.tsbuildinfo" -delete

# 重新构建
pnpm typecheck
```

## 寻求帮助

如果您遇到问题：

1. 查看 [README.md](./README.md) 了解项目概览
2. 搜索 [Issues](https://github.com/your-org/ucc-blog/issues)
3. 创建新的 Issue 描述您的问题

## 许可证

通过贡献代码，您同意您的贡献将在 MIT 许可证下发布。
