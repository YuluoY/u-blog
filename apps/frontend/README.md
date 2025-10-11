# Template-Vue-TS

> 一个模板

## 🍔项目介绍

> 如果需要`husky`、`commintlint`，请依次执行以下命令

```bash
  pnpm run prepare
  echo "npx lint-staged" > .husky/pre-commit  --> v9
  npx husky add .husky/pre-commit "npx lint-staged"  --> v8
```

> 如果需要`commitlint`，请依次执行以下命令

```bash
  pnpm add @commitlint/config-conventional @commitlint/cli -D
  echo "npx --no -- commitlint --edit ${1}" > .husky/commit-msg --> v9
  npx husky add .husky/commit-msg "npx --no -- commitlint --edit ${1}" --> v8
```

- commitlint 配置文件：`commitlint.config.js`

```js
// more：https://github.com/angular/angular/blob/main/CONTRIBUTING.md
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build', // 编译相关的修改，如发布版本，对项目构建或依赖的改动
        'ci', // 对CI 配置文件和脚本的更改
        'chore', // 构建过程或辅助工具的变动，比如增加依赖库等
        'update', // 更新功能
        'docs', // 文档变动 documentation
        'feat', // 新增功能 feature
        'fix', // 修复bug
        'perf', // 性能优化  performance
        'refactor', // 重构
        'revert', // 撤回commit，回滚上一个版本
        'style', // 格式（不影响代码运行的变动）
        'test' // 测试（单元/集成测试）
      ]
    ],
    'type-case': [0],
    'type-empty': [0],
    'scope-empty': [0],
    'scope-case': [0],
    'subject-full-stop': [0, 'never'],
    'subject-case': [0, 'never'],
    'header-max-length': [0, 'always', 100]
  }
}
```

## 🧀如何设置以及启动项目

### 安装依赖

```bash
pnpm install
```

### 启动本地开发环境

```bash
pnpm start
```

### 构建生产环境

```bash
pnpm run build:prod
```

### 代码格式检查以及自动修复

```bash
pnpm run lint:fix
```

## 🍚目录大纲

```
template-vue-ts
├─ public
│  ├─ logo.svg
│  └─ vite.svg
├─ src
│  ├─ App.vue
│  ├─ assets
│  │  ├─ icons
│  │  ├─ images
│  │  └─ styles
│  │     ├─ index.scss
│  │     ├─ reset.scss
│  │     └─ variables.scss
│  ├─ auto-import.d.ts
│  ├─ components
│  ├─ components.d.ts
│  ├─ directive
│  ├─ hooks
│  ├─ lang
│  ├─ main.ts
│  ├─ router
│  │  └─ index.ts
│  ├─ service
│  ├─ store
│  ├─ types
│  ├─ utils
│  └─ views
│     └─ HomeView.vue
├─ tests
├─ README.md
├─ .editorconfig
├─ .env.development
├─ .env.production
├─ .eslintrc-auto-import.json
├─ .eslintrc.cjs
├─ .eslintrcignore
├─ .gitignore
├─ .prettierignore
├─ .prettierrc
├─ env.d.ts
├─ index.html
├─ package.json
├─ pnpm-lock.yaml
├─ tsconfig.config.json
├─ tsconfig.json
└─ vite.config.ts

```

## 🚀浏览器支持

Modern browsers and Internet Explorer 10+.

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>IE / Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)</br>Safari |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IE10, IE11, Edge                                                                                                                                                                                                | last 2 versions                                                                                                                                                                                                   | last 2 versions                                                                                                                                                                                               | last 2 versions                                                                                                                                                                                               |

## 🍟License

[MIT License](https://github.com/Armour/vue-typescript-admin-template/blob/master/LICENSE)
