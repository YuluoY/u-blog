# Monorepo 架构指南

本文档详细说明 UCC Blog Monorepo 的架构设计、依赖管理策略和最佳实践。

## 📐 架构概览

### 项目结构

```
ucc-blog/
├── apps/                          # 应用层
│   ├── frontend/                  # Vue 3 前端应用
│   ├── admin/                     # React 管理后台
│   └── backend/                   # Express 后端服务
├── packages/                      # 包层（共享代码）
│   ├── ui/                        # Vue 3 UI 组件库
│   └── utils/                     # TypeScript 工具库
├── docs/                          # 文档
├── tsconfig.base.json            # TS 基础配置
├── tsconfig.json                 # TS 项目引用
├── pnpm-workspace.yaml           # Workspace 配置
├── .npmrc                        # pnpm 配置
└── package.json                  # 根配置
```

### 技术栈矩阵

| 项目               | 框架    | 语言       | 打包工具 | 运行时    |
| ------------------ | ------- | ---------- | -------- | --------- |
| **apps/frontend**  | Vue 3   | TypeScript | Vite     | Browser   |
| **apps/admin**     | React   | TypeScript | Vite     | Browser   |
| **apps/backend**   | Express | JavaScript | -        | Node.js   |
| **packages/ui**    | Vue 3   | TypeScript | Vite     | Browser   |
| **packages/utils** | -       | TypeScript | tsup     | Universal |

## 🎯 设计原则

### 1. 依赖提升策略

**目标**: 减少重复安装，统一版本管理

#### 根目录依赖（Hoisted）

在 `package.json` 根目录管理的依赖：

**框架核心:**

```json
{
  "dependencies": {
    "vue": "^3.5.22", // Frontend + UI
    "react": "^18.2.0", // Admin
    "react-dom": "^18.2.0", // Admin
    "axios": "^1.7.2", // 全局 HTTP 客户端
    "lodash-es": "^4.17.21" // 全局工具库
  }
}
```

**构建工具链:**

```json
{
  "devDependencies": {
    "typescript": "^5.5.4", // 统一 TS 版本
    "vite": "^5.2.6", // 统一构建工具
    "@vitejs/plugin-vue": "^5.0.4", // Vue 构建插件
    "@vitejs/plugin-react-swc": "^3.5.0", // React 构建插件
    "vitest": "^1.4.0", // 测试框架
    "eslint": "^8.57.0", // 代码检查
    "sass": "^1.72.0", // CSS 预处理
    "husky": "^9.0.11", // Git hooks
    "lint-staged": "^15.2.7" // 提交前检查
  }
}
```

#### 子项目特定依赖

**Frontend (`apps/frontend/package.json`):**

```json
{
  "dependencies": {
    "vue": "workspace:*", // 引用根依赖
    "axios": "workspace:*", // 引用根依赖
    "lodash-es": "workspace:*", // 引用根依赖
    "pinia": "^3.0.3", // Vue 状态管理
    "vue-router": "4", // Vue 路由
    "vue-i18n": "^9.13.1", // 国际化
    "md-editor-v3": "^6.0.1", // Markdown 编辑器
    "ucc-ui": "workspace:*" // 内部 UI 库
  }
}
```

**Admin (`apps/admin/package.json`):**

```json
{
  "dependencies": {
    "react": "workspace:*", // 引用根依赖
    "react-dom": "workspace:*" // 引用根依赖
    // React 生态的其他依赖...
  }
}
```

**Backend (`apps/backend/package.json`):**

```json
{
  "dependencies": {
    "express": "^4.19.2", // Web 框架
    "pg": "^8.12.0", // PostgreSQL 客户端
    "jsonwebtoken": "^9.0.2", // JWT 认证
    "ucc-utils": "workspace:*" // 内部工具库
  }
}
```

### 2. Workspace 协议

使用 `workspace:*` 引用内部包：

```json
{
  "dependencies": {
    "ucc-ui": "workspace:*",
    "ucc-utils": "workspace:*"
  }
}
```

**优点:**

- 自动链接到本地开发版本
- 发布时自动替换为具体版本号
- 支持热更新

### 3. pnpm Overrides

统一关键依赖的版本：

```json
{
  "pnpm": {
    "overrides": {
      "typescript": "^5.5.4",
      "vue": "^3.5.22",
      "react": "^18.2.0",
      "axios": "^1.7.2"
    }
  }
}
```

## 🔧 TypeScript 配置架构

### 配置继承链

```
tsconfig.base.json (基础配置)
    │
    ├── apps/frontend/tsconfig.json
    │       ├── extends: ../../tsconfig.base.json
    │       └── extends: @vue/tsconfig/*
    │
    ├── apps/admin/tsconfig.json
    │       └── extends: ../../tsconfig.base.json
    │
    ├── packages/ui/tsconfig.json
    │       ├── extends: ../../tsconfig.base.json
    │       └── extends: @vue/tsconfig/tsconfig.dom.json
    │
    └── packages/utils/tsconfig.json
            └── extends: ../../tsconfig.base.json
```

### 基础配置 (`tsconfig.base.json`)

```json
{
  "compilerOptions": {
    // 目标和模块
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],

    // 模块解析
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,

    // 严格模式
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,

    // 互操作
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,

    // 其他
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### 项目引用 (`tsconfig.json`)

启用增量构建和类型检查：

```json
{
  "files": [],
  "references": [
    { "path": "./apps/frontend" },
    { "path": "./apps/admin" },
    { "path": "./apps/backend" },
    { "path": "./packages/ui" },
    { "path": "./packages/utils" }
  ]
}
```

**使用方式:**

```bash
# 构建所有项目（增量）
tsc --build

# 清理构建缓存
tsc --build --clean

# 强制重新构建
tsc --build --force
```

## 📦 包管理

### pnpm 配置 (`.npmrc`)

```ini
# 严格引擎版本
engine-strict=true

# 不提升所有依赖（更严格的隔离）
shamefully-hoist=false

# 自动安装 peer dependencies
auto-install-peers=true

# 链接 workspace 包
link-workspace-packages=true

# 共享锁文件
shared-workspace-lockfile=true
```

### 依赖查找优先级

1. **项目 `node_modules`**: 项目特定的依赖
2. **Workspace root `node_modules`**: 提升的共享依赖
3. **全局 store**: pnpm 的内容寻址存储

### 添加依赖的最佳实践

```bash
# ❌ 错误：在根目录直接 add
pnpm add some-package

# ✅ 正确：指定添加位置

# 1. 添加到根目录（所有项目共享）
pnpm add -Dw some-build-tool

# 2. 添加到特定项目
pnpm --filter @ucc-blog/frontend add some-vue-plugin

# 3. 添加 workspace 内部包
pnpm --filter @ucc-blog/frontend add ucc-ui@workspace:*
```

## 🚀 构建流程

### 构建顺序

```
1. packages/utils (被其他包依赖)
   ↓
2. packages/ui (被 apps 依赖)
   ↓
3. apps/* (应用层)
```

### 构建脚本

```json
{
  "scripts": {
    "build": "pnpm --recursive --filter \"./packages/*\" build && pnpm --recursive --filter \"./apps/*\" build",
    "build:packages": "pnpm --recursive --filter \"./packages/*\" build",
    "build:apps": "pnpm --recursive --filter \"./apps/*\" build"
  }
}
```

### 并行 vs 串行

```bash
# 并行构建（同一层级）
pnpm --parallel --filter "./apps/*" dev

# 串行构建（有依赖关系）
pnpm --recursive --filter "./packages/*" build
```

## 🔄 开发工作流

### 本地开发

```bash
# 1. 安装所有依赖
pnpm install

# 2. 构建共享包（首次）
pnpm build:packages

# 3. 启动开发服务器
pnpm dev
```

### 热更新机制

- **Frontend/Admin**: Vite HMR
- **Backend**: nodemon 监听文件变化
- **Packages**: 通过 `workspace:*` 自动链接，修改后立即生效

### 调试

```bash
# 查看依赖树
pnpm list -r

# 查看为什么安装某个包
pnpm why axios

# 检查 workspace 链接
pnpm list --depth -1

# 验证依赖完整性
pnpm audit
```

## 📊 性能优化

### 1. 依赖去重

pnpm 天然支持依赖去重，相同版本的包只安装一次。

### 2. 构建缓存

- TypeScript: 使用 `tsBuildInfoFile` 增量编译
- Vite: 自动缓存 `node_modules/.vite`

### 3. 并行任务

```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter \"./apps/*\" dev"
  }
}
```

## 🛠️ 故障排除

### 问题 1: 依赖安装失败

```bash
# 清理缓存
pnpm store prune

# 删除锁文件和 node_modules
rm -rf pnpm-lock.yaml node_modules

# 重新安装
pnpm install
```

### 问题 2: TypeScript 类型错误

```bash
# 清理 TS 缓存
find . -name "*.tsbuildinfo" -delete

# 重新构建
pnpm typecheck
```

### 问题 3: Workspace 链接失败

```bash
# 重新链接
pnpm install --force

# 或重新构建 packages
pnpm build:packages
```

### 问题 4: 版本冲突

检查 `pnpm-lock.yaml` 中的版本，使用 overrides 强制统一：

```json
{
  "pnpm": {
    "overrides": {
      "problematic-package": "1.2.3"
    }
  }
}
```

## 📚 参考资源

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Monorepo Tools](https://monorepo.tools/)
- [Changesets](https://github.com/changesets/changesets)

## 🎓 最佳实践总结

1. **依赖管理**

   - 公共依赖提升到根目录
   - 特定依赖保留在子项目
   - 使用 workspace 协议引用内部包

2. **TypeScript**

   - 使用共享的 `tsconfig.base.json`
   - 启用项目引用支持增量构建
   - 每个子项目设置 `composite: true`

3. **构建**

   - 先构建 packages，再构建 apps
   - 使用并行构建提升效率
   - 利用缓存机制

4. **版本控制**

   - 使用 Changesets 管理版本
   - 遵循 Conventional Commits
   - 统一的 commit hooks

5. **文档**
   - 保持 README 更新
   - 记录架构决策
   - 提供清晰的贡献指南
