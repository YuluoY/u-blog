/**
 * PM2 生态系统配置
 *
 * 管理 u-blog 后端进程，支持 cluster 模式、日志轮转与优雅重启。
 * 使用方式：pm2 start ecosystem.config.js --env production
 */
module.exports = {
  apps: [
    {
      name: 'u-blog-backend',
      cwd: './apps/backend',
      script: 'dist/src/main.js',
      node_args: '--enable-source-maps',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      // 日志
      error_file: '../../logs/pm2-error.log',
      out_file: '../../logs/pm2-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // 优雅重启
      kill_timeout: 5000,
      listen_timeout: 8000,
      // 崩溃保护
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,
      autorestart: true,
    },
  ],
}
