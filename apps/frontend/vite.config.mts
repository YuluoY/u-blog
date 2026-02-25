import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import crypto from 'node:crypto'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import AutoImport from 'unplugin-auto-import/vite'
import UnCompoent from 'unplugin-vue-components/vite'

// src路径
const SRC_PATH = fileURLToPath(new URL('./src', import.meta.url))

// 导入全局样式文件，可以引入多个
const GLOBAL_STYLES = `
  @use "@/assets/styles/variables.scss" as *;
`

// 构建哈希：每次构建产出唯一标识，前端用于检测版本更新
const BUILD_HASH = crypto.randomBytes(8).toString('hex')
const BUILD_TIME = new Date().toISOString()

/**
 * Vite 插件：构建完成后在 dist 目录输出 version.json
 * 前端通过定时轮询该文件检测是否有新版本部署
 */
function versionJsonPlugin() {
  return {
    name: 'version-json',
    apply: 'build' as const,
    closeBundle() {
      const outDir = resolve(__dirname, 'dist')
      const versionData = JSON.stringify({ hash: BUILD_HASH, buildTime: BUILD_TIME })
      writeFileSync(resolve(outDir, 'version.json'), versionData, 'utf-8')
    }
  }
}

export default defineConfig({
  define: {
    // 注入构建哈希，前端运行时可通过 __BUILD_HASH__ 访问当前版本标识
    __BUILD_HASH__: JSON.stringify(BUILD_HASH),
  },
  build: {
    manifest: true,
    rollupOptions: {
      output: {
        /**
         * 手动分包策略：将大型第三方库拆分为独立 chunk，
         * 减小首屏主 chunk 体积 + 提升浏览器缓存命中率
         *
         * 重要：Vue 生态 + UI 组件 + 图标必须在同一 chunk，
         * 否则 ES Module 初始化顺序会导致 TDZ 循环引用错误
         * (Cannot access 'ce' before initialization)
         */
        manualChunks(id) {
          // Vite 的 __vitePreload 辅助函数：强制拆分为独立微型 chunk，
          // 避免被 Rollup 自动归入 vendor-md 导致 entry 静态依赖 870KB 的 md-editor
          if (id.includes('vite/preload-helper'))
            return 'vendor-preload'
          // Vue 生态 + @u-blog/ui + FontAwesome → vendor-core
          // 合并为单 chunk 避免跨 chunk 循环依赖 TDZ 问题
          if (id.includes('node_modules/vue') ||
              id.includes('node_modules/@vue') ||
              id.includes('node_modules/pinia') ||
              id.includes('node_modules/vue-router') ||
              id.includes('node_modules/vue-i18n') ||
              id.includes('node_modules/@fortawesome') ||
              id.includes('packages/ui/dist'))
            return 'vendor-core'

          // Markdown 编辑器/预览 → vendor-md（仅路由懒加载时引用）
          if (id.includes('node_modules/md-editor-v3'))
            return 'vendor-md'

          // lodash → vendor-lodash
          if (id.includes('node_modules/lodash-es'))
            return 'vendor-lodash'

          // animate.css → vendor-animate
          if (id.includes('node_modules/animate.css'))
            return 'vendor-animate'

          // axios → vendor-axios
          if (id.includes('node_modules/axios'))
            return 'vendor-axios'
        }
      }
    }
  },
  optimizeDeps: {
    // 不预构建 UI 包，避免 dist/es 内相对路径（如 ./vendors-xxx.js）解析失败
    exclude: ['@u-blog/ui'],
    // 显式包含 md-editor-v3，减少预构建缓存过期导致的 504 Outdated Optimize Dep
    include: ['md-editor-v3']
  },
  assetsInclude: ['**/*.jpg', '**/*.jpeg', '**/*.png', '**/*.gif', '**/*.svg'],
  plugins: [
    vue(),
    vueJsx(),
    AutoImport({
      imports: ['vue', 'vue-router'],
      dts: 'src/auto-import.d.ts',
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/ // .md
      ],
      eslintrc: {
        // 这里先设置成true然后npm run dev 运行之后会生成 .eslintrc-auto-import.json 文件之后，在改为false
        enabled: true,
        filepath: './.eslintrc-auto-import.json', // 生成的文件路径
        globalsPropValue: true
      }
    }),
    // 组件自动导入
    UnCompoent({
      dts: 'src/components.d.ts',
      resolvers: [
        // 解析UI包中的组件
        componentName =>
        {
          if (componentName.startsWith('U'))
            return { name: componentName, from: '@u-blog/ui' }
          return undefined
        }
      ]
    })
    // eslintPlugin({
    //   cache: false
    // })
    ,
    versionJsonPlugin()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      // IP 定位接口走代理，避免跨域（ip.zhengbingdong.com）
      '/ip-api': {
        target: 'https://ip.zhengbingdong.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/ip-api/, '')
      }
    }
  },

  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      '@': SRC_PATH
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler', // 使用现代编译器API
        additionalData: GLOBAL_STYLES, // 引入全局变量
        silenceDeprecations: ['legacy-js-api'] // 静默弃用警告
      }
    }
  }
})
