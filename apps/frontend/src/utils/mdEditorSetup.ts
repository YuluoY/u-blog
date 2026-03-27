/**
 * md-editor-v3 全局配置（懒加载）
 *
 * 首屏不加载 md-editor-v3 相关 JS/CSS，仅在首次渲染 Markdown 时
 * 由使用方导入本模块触发配置。本模块与使用方同处一个 lazy chunk，
 * 不会增加额外网络请求。
 *
 * 所有使用 md-editor-v3 的组件/composable 在 setup 阶段
 * 调用 ensureMdEditorConfig() 即可（同步，幂等）。
 */
import { config } from 'md-editor-v3'

let configured = false

/**
 * 确保 md-editor-v3 全局配置已执行（同步、幂等）
 */
export function ensureMdEditorConfig(): void
{
  if (configured) return
  configured = true

  config({
    markdownItConfig(md)
    {
      // 单个换行符渲染为 <br>，使预览区换行与编辑区一致
      md.set({ breaks: true })

      // 文章内链接在新标签页打开
      const defaultRender = md.renderer.rules.link_open
        || ((tokens: any[], idx: number, options: any, _env: any, self: any) => self.renderToken(tokens, idx, options))

      md.renderer.rules.link_open = (tokens: any[], idx: number, options: any, env: any, self: any) =>
      {
        const token = tokens[idx]
        token.attrSet('target', '_blank')
        token.attrSet('rel', 'noopener noreferrer')
        return defaultRender(tokens, idx, options, env, self)
      }

      /**
       * 首行缩进渲染规则
       *
       * 编辑器通过 WriteEditor.toggleLineIndent() 在 markdown 源码行首插入两个全角空格
       * `\u3000\u3000`（IDEOGRAPHIC SPACE），但 markdown-it 的段落解析会 trim 掉段首空白，
       * 导致预览区和阅读页丢失首行缩进。
       *
       * 此 core 规则在 block 解析完成后、inline 解析之前，根据原始源码行检测缩进标记，
       * 给对应 `<p>` 添加 `.u-text-indent` class，由 CSS `text-indent: 2em` 补偿渲染。
       * 段落内后续行（`<br>` 之后）的 `\u3000\u3000` 不会被 trim，保持原生渲染。
       */
      md.core.ruler.push('text_indent', (state: any) =>
      {
        const lines = state.src.split('\n')
        const tokens = state.tokens
        for (let i = 0; i < tokens.length; i++)
        {
          if (tokens[i].type === 'paragraph_open')
          {
            const inlineTok = tokens[i + 1]
            if (inlineTok?.type === 'inline' && inlineTok.map)
            {
              const firstLine = lines[inlineTok.map[0]]
              if (firstLine && /^(?:>\s*)*\u3000\u3000/.test(firstLine))
                tokens[i].attrJoin('class', 'u-text-indent')
            }
          }
        }
      })
    },
  })
}
