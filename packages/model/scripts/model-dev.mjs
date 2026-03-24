#!/usr/bin/env node
/**
 * tsup --watch 会在每次重编后覆盖 dist/index.d.ts，而 patch-dts 必须在 DTS 生成之后执行
 * （tsup 的 onSuccess 早于 DTS，不能用于打补丁）。本脚本并行启动 tsup watch，并监听 dist 下声明文件变更后 debounce 执行 patch-dts。
 */
import { spawn } from 'node:child_process'
import { existsSync, watch } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = resolve(__dirname, '..')
const distDir = resolve(pkgRoot, 'dist')

let debounceTimer
function runPatch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (!existsSync(resolve(distDir, 'index.d.ts'))) return
    const child = spawn('node', ['patch-dts.mjs'], {
      cwd: pkgRoot,
      stdio: 'inherit',
      shell: false,
    })
    child.on('error', (err) => console.error('[model-dev] patch-dts 启动失败:', err.message))
  }, 200)
}

function attachDistWatcher() {
  if (!existsSync(distDir)) {
    setTimeout(attachDistWatcher, 200)
    return
  }
  watch(distDir, { persistent: true }, (event, filename) => {
    if (event !== 'change' && event !== 'rename') return
    // macOS 上 filename 可能为 null，此时对 dist 任意变更也尝试打补丁（debounce 可吸收重复）
    if (filename == null || filename === 'index.d.ts' || filename === 'index.d.cts') runPatch()
  })
  runPatch()
}

const tsup = spawn('npx', ['tsup', '--watch'], {
  cwd: pkgRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

tsup.on('error', (err) => {
  console.error('[model-dev] tsup 启动失败:', err.message)
  process.exit(1)
})

tsup.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 0)
})

attachDistWatcher()
