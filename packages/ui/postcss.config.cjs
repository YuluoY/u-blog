/**
 * UI 组件库 PostCSS 配置
 * - 构建时会对 CSS 生效，便于后续做样式前缀/命名空间扩展。
 * - 启用前缀：安装 postcss-prefix-selector 后取消下方注释，并设置 prefix。
 * - skipGlobalSelectors: true 会保留 :root / :root.dark，主题变量仍作用于文档根，仅组件选择器被加前缀。
 */
module.exports = {
  plugins: {
    // 后续可启用：为组件选择器加命名空间，避免与业务样式冲突
    // 需安装: pnpm add -D postcss-prefix-selector
    // 'postcss-prefix-selector': {
    //   prefix: '.u-blog-ui',
    //   skipGlobalSelectors: true, // 保留 :root / :root.dark，主题切换不受影响
    // },
  },
}
