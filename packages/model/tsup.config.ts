import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  outDir: 'dist',
  dts: {
    resolve: true,
    compilerOptions: {
      composite: false
    }
  },
  clean: false,
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  splitting: false,
  external: [],
  target: 'es2020',
  platform: 'neutral',
  keepNames: true,
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.mjs',
    }
  },
  onSuccess: 'echo "构建成功！"',
  watch: false,
  silent: false,
})
