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

  .md-editor {
    background: transparent !important;
    --md-bk-color: transparent;
  }

  .md-editor-preview-wrapper {
    padding: 0;
  }

  .md-editor-preview {
    padding: 0;
  }

  .md-editor-h1,
  .md-editor-h2,
  .md-editor-h3,
  .md-editor-h4,
  .md-editor-h5,
  .md-editor-h6 {
    color: var(--u-text-1);
    margin: 1.5em 0 0.5em;
    font-weight: 600;
  }

  .md-editor-h1 { font-size: 2rem; }
  .md-editor-h2 { font-size: 1.7rem; }
  .md-editor-h3 { font-size: 1.5rem; }
  .md-editor-h4 { font-size: 1.3rem; }

  .md-editor-p {
    margin: 0.8em 0;
    line-height: 1.8;
    color: var(--u-text-2);
  }

  .md-editor-ul,
  .md-editor-ol {
    padding-left: 1.5em;
    margin: 0.8em 0;
  }

  .md-editor-li {
    margin: 0.4em 0;
  }

  .md-editor-a {
    color: var(--u-primary);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  .md-editor-code {
    background: var(--u-background-2);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
    font-family: 'Consolas', 'Monaco', monospace;
  }

  .md-editor-pre {
    background: var(--u-background-2);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;

    .md-editor-code {
      background: none;
      padding: 0;
    }
  }

  .md-editor-blockquote {
    border-left: 4px solid var(--u-primary);
    margin: 1em 0;
    padding: 0.5em 1em;
    background: var(--u-background-2);
    color: var(--u-text-3);
  }

  .md-editor-img {
    max-width: 100%;
    border-radius: 8px;
  }

  .md-editor-hr {
    border: none;
    border-top: 1px solid var(--u-border-1);
    margin: 1.5em 0;
  }

  .md-editor-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;

    th, td {
      border: 1px solid var(--u-border-1);
      padding: 8px 12px;
      text-align: left;
    }

    th {
      background: var(--u-background-2);
      font-weight: 600;
    }
  }
}
</style>
