import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import vueJsx from '@vitejs/plugin-vue-jsx'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    dts({
      outDir: 'dist/types',
      // 排除不需要的文件和目录
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts', 
        '**/*.stories.ts',
        '**/test/**',
        '**/tests/**',
        '**/__test__/**',
        '**/play/**',
        '**/docs/**',
        '**/*.md'
      ]
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler' // 使用现代编译器 API
      }
    }
  },
  build: {
    outDir: 'dist/es',
    emptyOutDir: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log'],
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
      }
    },
    lib: {
      entry: resolve(__dirname, './src/core/index.ts'),
      name: 'UccUI',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: [
        'vue',
        '@fortawesome/fontawesome-svg-core',
        '@fortawesome/free-solid-svg-icons',
        '@fortawesome/free-regular-svg-icons',
        '@fortawesome/free-brands-svg-icons',
        '@fortawesome/vue-fontawesome',
        '@popperjs/core',
        'async-validator',
        // monaco-editor 不再全局导入，设为 external 避免打入 vendors
        'monaco-editor',
        // 内部包设为 external，支持 tree-shaking
        '@ucc-blog/utils',
        '@ucc-blog/composables',
        '@ucc-blog/helper'
      ],
      // 排除特定文件
      plugins: [
        {
          name: 'exclude-files',
          resolveId(id) {
            // 排除测试文件、文档文件、play 目录等
            if (
              id.includes('/test/') || 
              id.includes('/tests/') || 
              id.includes('/__tests__/') ||
              id.includes('/play/') ||
              id.includes('/docs/') ||
              id.includes('.test.') || 
              id.includes('.spec.') || 
              id.includes('.stories.') ||
              id.endsWith('.md')
            ) {
              return { id, external: true }
            }
            return null
          }
        }
      ],
      output: {
        assetFileNames: assetInfo =>
        {
          if (assetInfo.name === 'style.css')
            return 'index.css' as string
          return assetInfo.name as string
        }
      }
    }
  }
})