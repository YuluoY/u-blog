import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dtsPath = resolve(__dirname, 'dist/index.d.ts')
const dctsPath = resolve(__dirname, 'dist/index.d.cts')

if (!existsSync(dtsPath)) {
  console.log('dist/index.d.ts 不存在，跳过补丁')
  process.exit(0)
}

let content = readFileSync(dtsPath, 'utf-8')
let patched = false

if (!content.includes('CVisualStyle')) {
const cVisualInject = `declare const CVisualStyle: {
    readonly DEFAULT: "default";
    readonly GLASS: "glass";
};
`
const visualTypeInject = `type VisualStyle = typeof CVisualStyle[keyof typeof CVisualStyle];
`

const cThemeMatch = content.match(/declare const CTheme:[\s\S]*?};/)
if (cThemeMatch) {
  content = content.replace(cThemeMatch[0], cThemeMatch[0] + '\n' + cVisualInject)
}

// 匹配完整一行 type Theme = typeof CTheme[keyof typeof CTheme]; 避免留下残段
const themeTypeMatch = content.match(/type Theme = typeof CTheme\[keyof typeof CTheme\];?\s*\n/)
if (themeTypeMatch) {
  content = content.replace(themeTypeMatch[0], themeTypeMatch[0] + visualTypeInject + '\n')
}

const exportMatch = content.match(/export \{[^}]+\};/)
if (exportMatch) {
  let newExport = exportMatch[0]
    .replace('CTheme,', 'CVisualStyle, CTheme,')
    .replace('type Theme,', 'type Theme, type VisualStyle,')
  content = content.replace(exportMatch[0], newExport)
  patched = true
}
}

if (!content.includes('readonly SKILLS:')) {
  content = content.replace(
    /(readonly TIMELINE: "timeline";)\n(\s+readonly CUSTOM:)/,
    '$1\n    readonly SKILLS: "skills";\n$2'
  )
  patched = true
}

writeFileSync(dtsPath, content)
if (existsSync(dctsPath)) {
  writeFileSync(dctsPath, content)
}
console.log(patched ? '已注入 CVisualStyle/VisualStyle 或 CPageBlockType.SKILLS 类型定义' : '已注入 CVisualStyle 和 VisualStyle 类型定义')
