// vite.config.mts
import { defineConfig } from "file:///D:/Desktop/%E6%88%91%E7%9A%84%E9%A1%B9%E7%9B%AE/ucc-blog/ucc-blog-front/node_modules/.pnpm/vite@5.4.0_@types+node@18.19.44_sass@1.77.8/node_modules/vite/dist/node/index.js";
import { fileURLToPath, URL } from "node:url";
import vue from "file:///D:/Desktop/%E6%88%91%E7%9A%84%E9%A1%B9%E7%9B%AE/ucc-blog/ucc-blog-front/node_modules/.pnpm/@vitejs+plugin-vue@5.1.2_vite@5.4.0_@types+node@18.19.44_sass@1.77.8__vue@3.4.37_typescript@5.5.4_/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import "file:///D:/Desktop/%E6%88%91%E7%9A%84%E9%A1%B9%E7%9B%AE/ucc-blog/ucc-blog-front/node_modules/.pnpm/vite-plugin-eslint@1.8.1_eslint@8.57.0_vite@5.4.0_@types+node@18.19.44_sass@1.77.8_/node_modules/vite-plugin-eslint/dist/index.mjs";
import AutoImport from "file:///D:/Desktop/%E6%88%91%E7%9A%84%E9%A1%B9%E7%9B%AE/ucc-blog/ucc-blog-front/node_modules/.pnpm/unplugin-auto-import@0.17.8_rollup@4.20.0/node_modules/unplugin-auto-import/dist/vite.js";
import UnCompoent from "file:///D:/Desktop/%E6%88%91%E7%9A%84%E9%A1%B9%E7%9B%AE/ucc-blog/ucc-blog-front/node_modules/.pnpm/unplugin-vue-components@0.26.0_@babel+parser@7.25.3_rollup@4.20.0_vue@3.4.37_typescript@5.5.4_/node_modules/unplugin-vue-components/dist/vite.js";
var __vite_injected_original_import_meta_url = "file:///D:/Desktop/%E6%88%91%E7%9A%84%E9%A1%B9%E7%9B%AE/ucc-blog/ucc-blog-front/vite.config.mts";
var COMPONENTS_PATH = fileURLToPath(new URL("./src/components", __vite_injected_original_import_meta_url));
var SRC_PATH = fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url));
var GLOBAL_STYLES = `
  @use "@/assets/styles/variables.scss" as *;
`;
var vite_config_default = defineConfig({
  build: {
    manifest: true
  },
  plugins: [
    vue(),
    AutoImport({
      imports: ["vue", "vue-router"],
      dts: "src/auto-import.d.ts",
      include: [
        /\.[tj]sx?$/,
        // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/,
        // .vue
        /\.md$/
        // .md
      ],
      eslintrc: {
        // 这里先设置成true然后npm run dev 运行之后会生成 .eslintrc-auto-import.json 文件之后，在改为false
        enabled: true,
        filepath: "./.eslintrc-auto-import.json",
        // 生成的文件路径
        globalsPropValue: true
      }
    }),
    UnCompoent({
      dts: "src/components.d.ts",
      dirs: [COMPONENTS_PATH]
    })
    // eslintPlugin({
    //   cache: false
    // })
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  },
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
    alias: {
      "@": SRC_PATH,
      "@/components": COMPONENTS_PATH,
      "ucc-utils": fileURLToPath(new URL("./src/utils/index.ts", __vite_injected_original_import_meta_url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: GLOBAL_STYLES
        // 引入全局变量
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcRGVza3RvcFxcXFxcdTYyMTFcdTc2ODRcdTk4NzlcdTc2RUVcXFxcdWNjLWJsb2dcXFxcdWNjLWJsb2ctZnJvbnRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXERlc2t0b3BcXFxcXHU2MjExXHU3Njg0XHU5ODc5XHU3NkVFXFxcXHVjYy1ibG9nXFxcXHVjYy1ibG9nLWZyb250XFxcXHZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovRGVza3RvcC8lRTYlODglOTElRTclOUElODQlRTklQTElQjklRTclOUIlQUUvdWNjLWJsb2cvdWNjLWJsb2ctZnJvbnQvdml0ZS5jb25maWcubXRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnXHJcblxyXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcclxuaW1wb3J0IGVzbGludFBsdWdpbiBmcm9tICd2aXRlLXBsdWdpbi1lc2xpbnQnXHJcbmltcG9ydCBBdXRvSW1wb3J0IGZyb20gJ3VucGx1Z2luLWF1dG8taW1wb3J0L3ZpdGUnXHJcbmltcG9ydCBVbkNvbXBvZW50IGZyb20gJ3VucGx1Z2luLXZ1ZS1jb21wb25lbnRzL3ZpdGUnXHJcblxyXG4vLyBjb21wb25lbnRzXHU4REVGXHU1Rjg0XHJcbmNvbnN0IENPTVBPTkVOVFNfUEFUSCA9IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMvY29tcG9uZW50cycsIGltcG9ydC5tZXRhLnVybCkpXHJcbi8vIHNyY1x1OERFRlx1NUY4NFxyXG5jb25zdCBTUkNfUEFUSCA9IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKVxyXG5cclxuLy8gXHU1QkZDXHU1MTY1XHU1MTY4XHU1QzQwXHU2ODM3XHU1RjBGXHU2NTg3XHU0RUY2XHVGRjBDXHU1M0VGXHU0RUU1XHU1RjE1XHU1MTY1XHU1OTFBXHU0RTJBXHJcbmNvbnN0IEdMT0JBTF9TVFlMRVMgPSBgXHJcbiAgQHVzZSBcIkAvYXNzZXRzL3N0eWxlcy92YXJpYWJsZXMuc2Nzc1wiIGFzICo7XHJcbmBcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgYnVpbGQ6IHtcclxuICAgIG1hbmlmZXN0OiB0cnVlXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICB2dWUoKSxcclxuICAgIEF1dG9JbXBvcnQoe1xyXG4gICAgICBpbXBvcnRzOiBbJ3Z1ZScsICd2dWUtcm91dGVyJ10sXHJcbiAgICAgIGR0czogJ3NyYy9hdXRvLWltcG9ydC5kLnRzJyxcclxuICAgICAgaW5jbHVkZTogW1xyXG4gICAgICAgIC9cXC5bdGpdc3g/JC8sIC8vIC50cywgLnRzeCwgLmpzLCAuanN4XHJcbiAgICAgICAgL1xcLnZ1ZSQvLFxyXG4gICAgICAgIC9cXC52dWVcXD92dWUvLCAvLyAudnVlXHJcbiAgICAgICAgL1xcLm1kJC8gLy8gLm1kXHJcbiAgICAgIF0sXHJcbiAgICAgIGVzbGludHJjOiB7XHJcbiAgICAgICAgLy8gXHU4RkQ5XHU5MUNDXHU1MTQ4XHU4QkJFXHU3RjZFXHU2MjEwdHJ1ZVx1NzEzNlx1NTQwRW5wbSBydW4gZGV2IFx1OEZEMFx1ODg0Q1x1NEU0Qlx1NTQwRVx1NEYxQVx1NzUxRlx1NjIxMCAuZXNsaW50cmMtYXV0by1pbXBvcnQuanNvbiBcdTY1ODdcdTRFRjZcdTRFNEJcdTU0MEVcdUZGMENcdTU3MjhcdTY1MzlcdTRFM0FmYWxzZVxyXG4gICAgICAgIGVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgZmlsZXBhdGg6ICcuLy5lc2xpbnRyYy1hdXRvLWltcG9ydC5qc29uJywgLy8gXHU3NTFGXHU2MjEwXHU3Njg0XHU2NTg3XHU0RUY2XHU4REVGXHU1Rjg0XHJcbiAgICAgICAgZ2xvYmFsc1Byb3BWYWx1ZTogdHJ1ZVxyXG4gICAgICB9XHJcbiAgICB9KSxcclxuICAgIFVuQ29tcG9lbnQoe1xyXG4gICAgICBkdHM6ICdzcmMvY29tcG9uZW50cy5kLnRzJyxcclxuICAgICAgZGlyczogW0NPTVBPTkVOVFNfUEFUSF1cclxuICAgIH0pXHJcbiAgICAvLyBlc2xpbnRQbHVnaW4oe1xyXG4gICAgLy8gICBjYWNoZTogZmFsc2VcclxuICAgIC8vIH0pXHJcbiAgXSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHJld3JpdGU6IHBhdGggPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJycpXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG5cclxuICByZXNvbHZlOiB7XHJcbiAgICBleHRlbnNpb25zOiBbJy5qcycsICcudHMnLCAnLmpzeCcsICcudHN4JywgJy5qc29uJywgJy52dWUnXSxcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgICdAJzogU1JDX1BBVEgsXHJcbiAgICAgICdAL2NvbXBvbmVudHMnOiBDT01QT05FTlRTX1BBVEgsXHJcbiAgICAgICd1Y2MtdXRpbHMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL3V0aWxzL2luZGV4LnRzJywgaW1wb3J0Lm1ldGEudXJsKSlcclxuICAgIH1cclxuICB9LFxyXG4gIGNzczoge1xyXG4gICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xyXG4gICAgICBzY3NzOiB7XHJcbiAgICAgICAgYWRkaXRpb25hbERhdGE6IEdMT0JBTF9TVFlMRVMgLy8gXHU1RjE1XHU1MTY1XHU1MTY4XHU1QzQwXHU1M0Q4XHU5MUNGXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBbVYsU0FBUyxvQkFBb0I7QUFDaFgsU0FBUyxlQUFlLFdBQVc7QUFFbkMsT0FBTyxTQUFTO0FBQ2hCLE9BQXlCO0FBQ3pCLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sZ0JBQWdCO0FBTnlLLElBQU0sMkNBQTJDO0FBU2pQLElBQU0sa0JBQWtCLGNBQWMsSUFBSSxJQUFJLG9CQUFvQix3Q0FBZSxDQUFDO0FBRWxGLElBQU0sV0FBVyxjQUFjLElBQUksSUFBSSxTQUFTLHdDQUFlLENBQUM7QUFHaEUsSUFBTSxnQkFBZ0I7QUFBQTtBQUFBO0FBSXRCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE9BQU87QUFBQSxJQUNMLFVBQVU7QUFBQSxFQUNaO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixXQUFXO0FBQUEsTUFDVCxTQUFTLENBQUMsT0FBTyxZQUFZO0FBQUEsTUFDN0IsS0FBSztBQUFBLE1BQ0wsU0FBUztBQUFBLFFBQ1A7QUFBQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUE7QUFBQSxRQUNBO0FBQUE7QUFBQSxNQUNGO0FBQUEsTUFDQSxVQUFVO0FBQUE7QUFBQSxRQUVSLFNBQVM7QUFBQSxRQUNULFVBQVU7QUFBQTtBQUFBLFFBQ1Ysa0JBQWtCO0FBQUEsTUFDcEI7QUFBQSxJQUNGLENBQUM7QUFBQSxJQUNELFdBQVc7QUFBQSxNQUNULEtBQUs7QUFBQSxNQUNMLE1BQU0sQ0FBQyxlQUFlO0FBQUEsSUFDeEIsQ0FBQztBQUFBO0FBQUE7QUFBQTtBQUFBLEVBSUg7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsVUFBUSxLQUFLLFFBQVEsVUFBVSxFQUFFO0FBQUEsTUFDNUM7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1AsWUFBWSxDQUFDLE9BQU8sT0FBTyxRQUFRLFFBQVEsU0FBUyxNQUFNO0FBQUEsSUFDMUQsT0FBTztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0wsZ0JBQWdCO0FBQUEsTUFDaEIsYUFBYSxjQUFjLElBQUksSUFBSSx3QkFBd0Isd0NBQWUsQ0FBQztBQUFBLElBQzdFO0FBQUEsRUFDRjtBQUFBLEVBQ0EsS0FBSztBQUFBLElBQ0gscUJBQXFCO0FBQUEsTUFDbkIsTUFBTTtBQUFBLFFBQ0osZ0JBQWdCO0FBQUE7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
