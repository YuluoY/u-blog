import net from 'node:net'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const BACKEND_PORT = 3000
const BACKEND_HOST = 'localhost'
/** 后端不可达时缓存时长（ms），避免高频 connect 探测 */
const DOWN_CACHE_MS = 3000
/** 后端可达时缓存时长（ms） */
const UP_CACHE_MS = 8000

let backendStatus: { up: boolean; until: number } = { up: false, until: 0 }

/** TCP 探测后端是否可达，带缓存 */
function isBackendReachable(): Promise<boolean> {
  const now = Date.now()
  if (now < backendStatus.until) return Promise.resolve(backendStatus.up)
  return new Promise((resolve) => {
    const socket = net.createConnection(
      { port: BACKEND_PORT, host: BACKEND_HOST, timeout: 300 },
      () => {
        socket.destroy()
        backendStatus = { up: true, until: Date.now() + UP_CACHE_MS }
        resolve(true)
      },
    )
    socket.on('error', () => {
      backendStatus = { up: false, until: Date.now() + DOWN_CACHE_MS }
      resolve(false)
    })
    socket.on('timeout', () => {
      socket.destroy()
      backendStatus = { up: false, until: Date.now() + DOWN_CACHE_MS }
      resolve(false)
    })
  })
}

/**
 * Vite 插件：在 proxy 之前拦截 /api 请求
 * 后端不可达时直接返回 503，避免 proxy 触发 ECONNREFUSED 日志
 */
function backendGuardPlugin(): Plugin {
  return {
    name: 'backend-guard',
    configureServer(server) {
      // configureServer 返回的回调在内部中间件（含 proxy）之 **前** 注入
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api')) return next()
        isBackendReachable().then((up) => {
          if (up) return next()
          res.statusCode = 503
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ code: 503, message: '后端服务未就绪，请稍后重试' }))
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), backendGuardPlugin()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: `http://${BACKEND_HOST}:${BACKEND_PORT}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
