import { defineConfig } from 'tsup'

export default defineConfig({
  // 入口文件
  entry: ['src/index.ts'],
  
  // 输出格式
  format: ['cjs', 'esm'],
  
  // 输出目录
  outDir: 'dist',
  
  // 是否生成 d.ts 类型文件
  dts: true,
  
  // 是否清理输出目录
  clean: true,
  
  // 是否生成 source map
  sourcemap: true,
  
  // 是否压缩代码
  // 开发环境: false (便于调试)
  // 生产环境: true (减小包体积)
  minify: process.env.NODE_ENV === 'production',
  
  // 是否分割代码
  splitting: true,

  // 外部依赖（不会被打包）
  external: ['vue'],
  
  // 目标环境
  target: 'es2020',
  
  // 平台
  platform: 'neutral',
  
  // 是否保持文件结构
  keepNames: true,
  
  // 自定义输出文件名
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    }
  },
  
  // 构建钩子
  onSuccess: 'echo "构建成功！"',
  
  // 监听模式
  watch: false,
  
  // 是否显示构建信息
  silent: false,
})
