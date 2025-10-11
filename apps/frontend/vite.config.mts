import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

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

export default defineConfig({
  build: {
    manifest: true
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
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
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
