// vite.es.config.ts
import { defineConfig } from "file:///Users/huyongle/Desktop/Projects/u-blog/node_modules/.pnpm/vite@5.4.20_@types+node@20.19.19_lightningcss@1.31.1_sass@1.93.2_terser@5.44.0/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/huyongle/Desktop/Projects/u-blog/node_modules/.pnpm/@vitejs+plugin-vue@6.0.1_vite@5.4.20_@types+node@20.19.19_lightningcss@1.31.1_sass@1.93_ddb87070c3fea54effa5184407f4c16d/node_modules/@vitejs/plugin-vue/dist/index.js";
import { resolve } from "node:path";
import vueJsx from "file:///Users/huyongle/Desktop/Projects/u-blog/node_modules/.pnpm/@vitejs+plugin-vue-jsx@4.2.0_vite@5.4.20_@types+node@20.19.19_lightningcss@1.31.1_sass@_5f897769b1f891bf8139b0910ff19db6/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import dts from "file:///Users/huyongle/Desktop/Projects/u-blog/node_modules/.pnpm/vite-plugin-dts@4.5.4_@types+node@20.19.19_rollup@4.52.4_typescript@5.8.2_vite@5.4.20_@_8d39718653f0059cad45f908246d3911/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/huyongle/Desktop/Projects/u-blog/packages/ui";
var vite_es_config_default = defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    dts({
      outDir: "dist/types",
      // 排除不需要的文件和目录
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.stories.ts",
        "**/test/**",
        "**/tests/**",
        "**/__test__/**",
        "**/play/**",
        "**/docs/**",
        "**/*.md"
      ]
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "./src")
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
        // 使用现代编译器 API
      }
    }
  },
  build: {
    outDir: "dist/es",
    emptyOutDir: false,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log"]
      },
      mangle: {
        toplevel: true
      },
      format: {
        comments: false
      }
    },
    lib: {
      entry: resolve(__vite_injected_original_dirname, "./src/core/index.ts"),
      name: "UccUI",
      fileName: "index",
      formats: ["es"]
    },
    rollupOptions: {
      external: [
        "vue",
        "@fortawesome/fontawesome-svg-core",
        "@fortawesome/free-solid-svg-icons",
        "@fortawesome/free-regular-svg-icons",
        "@fortawesome/free-brands-svg-icons",
        "@fortawesome/vue-fontawesome",
        "@popperjs/core",
        "async-validator",
        // monaco-editor 不再全局导入，设为 external 避免打入 vendors
        "monaco-editor",
        // 内部包设为 external，支持 tree-shaking
        "@ucc-blog/utils",
        "@ucc-blog/composables",
        "@ucc-blog/helper"
      ],
      // 排除特定文件
      plugins: [
        {
          name: "exclude-files",
          resolveId(id) {
            if (id.includes("/test/") || id.includes("/tests/") || id.includes("/__tests__/") || id.includes("/play/") || id.includes("/docs/") || id.includes(".test.") || id.includes(".spec.") || id.includes(".stories.") || id.endsWith(".md")) {
              return { id, external: true };
            }
            return null;
          }
        }
      ],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css")
            return "index.css";
          return assetInfo.name;
        }
      }
    }
  }
});
export {
  vite_es_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5lcy5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvaHV5b25nbGUvRGVza3RvcC9Qcm9qZWN0cy91LWJsb2cvcGFja2FnZXMvdWlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9odXlvbmdsZS9EZXNrdG9wL1Byb2plY3RzL3UtYmxvZy9wYWNrYWdlcy91aS92aXRlLmVzLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvaHV5b25nbGUvRGVza3RvcC9Qcm9qZWN0cy91LWJsb2cvcGFja2FnZXMvdWkvdml0ZS5lcy5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAnbm9kZTpwYXRoJ1xuaW1wb3J0IHZ1ZUpzeCBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUtanN4J1xuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICB2dWUoKSxcbiAgICB2dWVKc3goKSxcbiAgICBkdHMoe1xuICAgICAgb3V0RGlyOiAnZGlzdC90eXBlcycsXG4gICAgICAvLyBcdTYzOTJcdTk2NjRcdTRFMERcdTk3MDBcdTg5ODFcdTc2ODRcdTY1ODdcdTRFRjZcdTU0OENcdTc2RUVcdTVGNTVcbiAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgJyoqLyoudGVzdC50cycsXG4gICAgICAgICcqKi8qLnNwZWMudHMnLCBcbiAgICAgICAgJyoqLyouc3Rvcmllcy50cycsXG4gICAgICAgICcqKi90ZXN0LyoqJyxcbiAgICAgICAgJyoqL3Rlc3RzLyoqJyxcbiAgICAgICAgJyoqL19fdGVzdF9fLyoqJyxcbiAgICAgICAgJyoqL3BsYXkvKionLFxuICAgICAgICAnKiovZG9jcy8qKicsXG4gICAgICAgICcqKi8qLm1kJ1xuICAgICAgXVxuICAgIH0pXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJylcbiAgICB9XG4gIH0sXG4gIGNzczoge1xuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgIHNjc3M6IHtcbiAgICAgICAgYXBpOiAnbW9kZXJuLWNvbXBpbGVyJyAvLyBcdTRGN0ZcdTc1MjhcdTczQjBcdTRFRTNcdTdGMTZcdThCRDFcdTU2NjggQVBJXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogJ2Rpc3QvZXMnLFxuICAgIGVtcHR5T3V0RGlyOiBmYWxzZSxcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgICAgcHVyZV9mdW5jczogWydjb25zb2xlLmxvZyddLFxuICAgICAgfSxcbiAgICAgIG1hbmdsZToge1xuICAgICAgICB0b3BsZXZlbDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBmb3JtYXQ6IHtcbiAgICAgICAgY29tbWVudHM6IGZhbHNlLFxuICAgICAgfVxuICAgIH0sXG4gICAgbGliOiB7XG4gICAgICBlbnRyeTogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9jb3JlL2luZGV4LnRzJyksXG4gICAgICBuYW1lOiAnVWNjVUknLFxuICAgICAgZmlsZU5hbWU6ICdpbmRleCcsXG4gICAgICBmb3JtYXRzOiBbJ2VzJ11cbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbXG4gICAgICAgICd2dWUnLFxuICAgICAgICAnQGZvcnRhd2Vzb21lL2ZvbnRhd2Vzb21lLXN2Zy1jb3JlJyxcbiAgICAgICAgJ0Bmb3J0YXdlc29tZS9mcmVlLXNvbGlkLXN2Zy1pY29ucycsXG4gICAgICAgICdAZm9ydGF3ZXNvbWUvZnJlZS1yZWd1bGFyLXN2Zy1pY29ucycsXG4gICAgICAgICdAZm9ydGF3ZXNvbWUvZnJlZS1icmFuZHMtc3ZnLWljb25zJyxcbiAgICAgICAgJ0Bmb3J0YXdlc29tZS92dWUtZm9udGF3ZXNvbWUnLFxuICAgICAgICAnQHBvcHBlcmpzL2NvcmUnLFxuICAgICAgICAnYXN5bmMtdmFsaWRhdG9yJyxcbiAgICAgICAgLy8gbW9uYWNvLWVkaXRvciBcdTRFMERcdTUxOERcdTUxNjhcdTVDNDBcdTVCRkNcdTUxNjVcdUZGMENcdThCQkVcdTRFM0EgZXh0ZXJuYWwgXHU5MDdGXHU1MTREXHU2MjUzXHU1MTY1IHZlbmRvcnNcbiAgICAgICAgJ21vbmFjby1lZGl0b3InLFxuICAgICAgICAvLyBcdTUxODVcdTkwRThcdTUzMDVcdThCQkVcdTRFM0EgZXh0ZXJuYWxcdUZGMENcdTY1MkZcdTYzMDEgdHJlZS1zaGFraW5nXG4gICAgICAgICdAdWNjLWJsb2cvdXRpbHMnLFxuICAgICAgICAnQHVjYy1ibG9nL2NvbXBvc2FibGVzJyxcbiAgICAgICAgJ0B1Y2MtYmxvZy9oZWxwZXInXG4gICAgICBdLFxuICAgICAgLy8gXHU2MzkyXHU5NjY0XHU3Mjc5XHU1QjlBXHU2NTg3XHU0RUY2XG4gICAgICBwbHVnaW5zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnZXhjbHVkZS1maWxlcycsXG4gICAgICAgICAgcmVzb2x2ZUlkKGlkKSB7XG4gICAgICAgICAgICAvLyBcdTYzOTJcdTk2NjRcdTZENEJcdThCRDVcdTY1ODdcdTRFRjZcdTMwMDFcdTY1ODdcdTY4NjNcdTY1ODdcdTRFRjZcdTMwMDFwbGF5IFx1NzZFRVx1NUY1NVx1N0I0OVxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL3Rlc3QvJykgfHwgXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCcvdGVzdHMvJykgfHwgXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCcvX190ZXN0c19fLycpIHx8XG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCcvcGxheS8nKSB8fFxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL2RvY3MvJykgfHxcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJy50ZXN0LicpIHx8IFxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnLnNwZWMuJykgfHwgXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCcuc3Rvcmllcy4nKSB8fFxuICAgICAgICAgICAgICBpZC5lbmRzV2l0aCgnLm1kJylcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICByZXR1cm4geyBpZCwgZXh0ZXJuYWw6IHRydWUgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIF0sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6IGFzc2V0SW5mbyA9PlxuICAgICAgICB7XG4gICAgICAgICAgaWYgKGFzc2V0SW5mby5uYW1lID09PSAnc3R5bGUuY3NzJylcbiAgICAgICAgICAgIHJldHVybiAnaW5kZXguY3NzJyBhcyBzdHJpbmdcbiAgICAgICAgICByZXR1cm4gYXNzZXRJbmZvLm5hbWUgYXMgc3RyaW5nXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpVixTQUFTLG9CQUFvQjtBQUM5VyxPQUFPLFNBQVM7QUFDaEIsU0FBUyxlQUFlO0FBQ3hCLE9BQU8sWUFBWTtBQUNuQixPQUFPLFNBQVM7QUFKaEIsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyx5QkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLElBQ0osT0FBTztBQUFBLElBQ1AsSUFBSTtBQUFBLE1BQ0YsUUFBUTtBQUFBO0FBQUEsTUFFUixTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDakM7QUFBQSxFQUNGO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDSCxxQkFBcUI7QUFBQSxNQUNuQixNQUFNO0FBQUEsUUFDSixLQUFLO0FBQUE7QUFBQSxNQUNQO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxJQUNiLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLGVBQWU7QUFBQSxRQUNmLFlBQVksQ0FBQyxhQUFhO0FBQUEsTUFDNUI7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLFVBQVU7QUFBQSxNQUNaO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixVQUFVO0FBQUEsTUFDWjtBQUFBLElBQ0Y7QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNILE9BQU8sUUFBUSxrQ0FBVyxxQkFBcUI7QUFBQSxNQUMvQyxNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsTUFDVixTQUFTLENBQUMsSUFBSTtBQUFBLElBQ2hCO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixVQUFVO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQTtBQUFBLFFBRUE7QUFBQTtBQUFBLFFBRUE7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQTtBQUFBLE1BRUEsU0FBUztBQUFBLFFBQ1A7QUFBQSxVQUNFLE1BQU07QUFBQSxVQUNOLFVBQVUsSUFBSTtBQUVaLGdCQUNFLEdBQUcsU0FBUyxRQUFRLEtBQ3BCLEdBQUcsU0FBUyxTQUFTLEtBQ3JCLEdBQUcsU0FBUyxhQUFhLEtBQ3pCLEdBQUcsU0FBUyxRQUFRLEtBQ3BCLEdBQUcsU0FBUyxRQUFRLEtBQ3BCLEdBQUcsU0FBUyxRQUFRLEtBQ3BCLEdBQUcsU0FBUyxRQUFRLEtBQ3BCLEdBQUcsU0FBUyxXQUFXLEtBQ3ZCLEdBQUcsU0FBUyxLQUFLLEdBQ2pCO0FBQ0EscUJBQU8sRUFBRSxJQUFJLFVBQVUsS0FBSztBQUFBLFlBQzlCO0FBQ0EsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLGdCQUFnQixlQUNoQjtBQUNFLGNBQUksVUFBVSxTQUFTO0FBQ3JCLG1CQUFPO0FBQ1QsaUJBQU8sVUFBVTtBQUFBLFFBQ25CO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
