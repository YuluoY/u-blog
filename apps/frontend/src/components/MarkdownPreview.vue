<template>
  <MdPreview
    :model-value="content"
    :preview="true"
    :show-line-number="false"
    :show-toolbar="false"
    :style="{ background: 'transparent' }"
    class="markdown-preview"
  />
</template>

<script setup lang="ts">
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'

defineOptions({ name: 'MarkdownPreview' })

defineProps<{
  content: string
}>()
</script>

<style lang="scss">
.markdown-preview {
  background: transparent !important;
  /*
   * 覆盖 md-editor-v3 默认主题变量，确保亮色和暗色主题下文字都清晰可见
   * --md-color 是 md-editor-v3 preview 的正文颜色 CSS 变量
   */
  --md-color: var(--u-text-1);
  --md-bk-color: transparent;
  --md-code-bg-color: var(--u-background-2);

  .md-editor {
    background: transparent !important;
    --md-bk-color: transparent;
  }

  /* 强制正文区容器继承主题文字色，防止库内部硬编码颜色 */
  .md-editor-preview-wrapper,
  .md-editor-preview {
    padding: 0;
    color: var(--u-text-1);
    font-size: inherit;
  }

  /*
   * md-editor-v3 MdPreview 渲染为标准 HTML 标签（h1/p/ul 等），
   * 需通过 .md-editor-preview 选择器覆盖库默认 margin / 颜色。
   */
  .md-editor-preview {
    h1, h2, h3, h4, h5, h6 {
      color: var(--u-text-1);
      margin: 1.2em 0 0.5em;
      font-weight: 600;
      line-height: 1.35;
    }

    h1 { font-size: 1.6em; }
    h2 { font-size: 1.35em; }
    h3 { font-size: 1.2em; }
    h4 { font-size: 1.1em; }

    p {
      margin: 0.6em 0;
      line-height: 1.6;
      color: var(--u-text-2);
      font-size: inherit;
    }

    ul, ol {
      padding-left: 1.5em;
      margin: 0.6em 0;
      line-height: 1.6;
    }

    li {
      margin: 0.25em 0;
      line-height: 1.6;
    }

    /* 列表内段落不产生额外间距 */
    li > p {
      margin: 0.15em 0;
    }

    a {
      color: var(--u-primary);
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    /* 仅覆盖行内 code，代码块由 md-editor-v3 的 .md-editor-code 组件管理 */
    :not(pre) > code {
      background: var(--u-background-2);
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-size: 0.9em;
      font-family: 'Consolas', 'Monaco', monospace;
    }

    blockquote {
      border-left: 4px solid var(--u-primary);
      margin: 0.75em 0;
      padding: 0.5em 1em;
      background: var(--u-background-2);
      color: var(--u-text-3);
      line-height: 1.6;
    }

    img {
      max-width: 100%;
      border-radius: 8px;
    }

    hr {
      border: none;
      border-top: 1px solid var(--u-border-1);
      margin: 1.5em 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--u-border-1);

      th, td {
        border: 1px solid var(--u-border-1);
        padding: 10px 14px;
        text-align: left;
        line-height: 1.5;
      }
      th {
        background: var(--u-background-3);
        font-weight: 600;
        color: var(--u-text-1);
      }
      td {
        color: var(--u-text-2);
      }
      /* 覆盖 md-editor-v3 默认 stripe 背景，适配亮/暗主题 */
      tr {
        background-color: transparent;
      }
      tr:nth-child(2n) {
        background-color: var(--u-background-2);
      }
      tbody tr:hover {
        background-color: var(--u-background-3);
      }
    }
  }
}
</style>
