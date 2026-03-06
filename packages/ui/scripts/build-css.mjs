/**
 * 按组件拆分 CSS 构建脚本
 * 将每个组件的 SCSS 独立编译为 dist/es/components/<name>/style.css
 * 并将 theme/index.scss 编译为 dist/es/base.css
 */
import { compile } from 'sass'
import { mkdirSync, writeFileSync, readdirSync, existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SRC = resolve(ROOT, 'src')
const DIST = resolve(ROOT, 'dist/es')
const NODE_MODULES = resolve(ROOT, 'node_modules')

function parsePackageRequest(url) {
  if (!url) return null
  const segments = url.split('/').filter(Boolean)
  if (!segments.length) return null

  if (url.startsWith('@')) {
    if (segments.length < 2) return null
    return {
      packageName: `${segments[0]}/${segments[1]}`,
      subpath: segments.slice(2).join('/'),
    }
  }

  return {
    packageName: segments[0],
    subpath: segments.slice(1).join('/'),
  }
}

function resolveExportEntry(pkgRoot, pkg, subpath) {
  if (!subpath || !pkg?.exports) return null
  const exportKey = `./${subpath}`
  const exported = pkg.exports[exportKey]
  if (!exported) return null

  if (typeof exported === 'string') return resolve(pkgRoot, exported)
  if (typeof exported === 'object') {
    const entry = exported.style || exported.import || exported.default || exported.require
    if (typeof entry === 'string') return resolve(pkgRoot, entry)
  }

  return null
}

// 自定义 importer：将裸包名解析到 node_modules
const npmImporter = {
  findFileUrl(url) {
    const request = parsePackageRequest(url)
    if (!request) return null

    const pkgPath = resolve(NODE_MODULES, request.packageName)
    if (!existsSync(pkgPath)) return null

    // 是目录（npm 包），通过 package.json 的 style/main 字段解析入口
    const pkgJson = resolve(pkgPath, 'package.json')
    if (existsSync(pkgJson)) {
      const pkg = JSON.parse(readFileSync(pkgJson, 'utf-8'))
      const exportEntry = resolveExportEntry(pkgPath, pkg, request.subpath)
      if (exportEntry && existsSync(exportEntry)) return pathToFileURL(exportEntry)

      const entry = pkg.style || pkg.main || 'index.css'
      return pathToFileURL(resolve(pkgPath, entry))
    }
    // 直接文件
    return pathToFileURL(pkgPath)
  }
}

// 通用编译选项
const sassOptions = {
  style: 'compressed',
  loadPaths: [SRC],
  importers: [npmImporter]
}

// 1. 编译 base.css（主题变量 + reset + 工具类）
function buildBase() {
  const entry = resolve(SRC, 'theme/index.scss')
  const result = compile(entry, sassOptions)
  const out = resolve(DIST, 'base.css')
  writeFileSync(out, result.css, 'utf-8')
  console.log(`  ✓ base.css (${(result.css.length / 1024).toFixed(1)}KB)`)
}

// 2. 按组件编译独立 CSS
function buildComponents() {
  const componentsDir = resolve(SRC, 'components')
  const dirs = readdirSync(componentsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  let count = 0
  for (const name of dirs) {
    const scssPath = resolve(componentsDir, name, 'styles/index.scss')
    if (!existsSync(scssPath)) continue

    try {
      const result = compile(scssPath, sassOptions)

      const outDir = resolve(DIST, 'components', name)
      mkdirSync(outDir, { recursive: true })
      writeFileSync(resolve(outDir, 'style.css'), result.css, 'utf-8')
      count++
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`)
    }
  }
  console.log(`  ✓ ${count} component CSS files`)
}

console.log('[build-css] Compiling per-component CSS...')
buildBase()
buildComponents()
console.log('[build-css] Done.')
