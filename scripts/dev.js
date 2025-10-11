#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 子项目配置
const packages = [
  {
    name: 'ui',
    path: join(rootDir, 'packages/ui'),
    command: 'pnpm',
    args: ['run', 'dev'],
    color: '\x1b[36m', // cyan
  },
  {
    name: 'utils',
    path: join(rootDir, 'packages/utils'),
    command: 'pnpm',
    args: ['run', 'dev'],
    color: '\x1b[32m', // green
  },
  {
    name: 'model',
    path: join(rootDir, 'packages/model'),
    command: 'pnpm',
    args: ['run', 'dev'],
    color: '\x1b[33m', // yellow
  },
  {
    name: 'helper',
    path: join(rootDir, 'packages/helper'),
    command: 'pnpm',
    args: ['run', 'dev'],
    color: '\x1b[35m', // magenta
  },
  {
    name: 'composables',
    path: join(rootDir, 'packages/composables'),
    command: 'pnpm',
    args: ['run', 'dev'],
    color: '\x1b[34m', // blue
  },
];

// 颜色重置
const reset = '\x1b[0m';

// 日志函数
function log(packageName, color, message) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${packageName}]${reset} ${message}`);
}

// 启动子进程
function startPackage(pkg) {
  return new Promise((resolve, reject) => {
    log(pkg.name, pkg.color, `Starting ${pkg.name} package...`);
    
    const child = spawn(pkg.command, pkg.args, {
      cwd: pkg.path,
      stdio: 'pipe',
      shell: true,
    });

    // 处理输出
    child.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log(pkg.name, pkg.color, output);
      }
    });

    child.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        log(pkg.name, pkg.color, `ERROR: ${output}`);
      }
    });

    child.on('error', (error) => {
      log(pkg.name, pkg.color, `Failed to start: ${error.message}`);
      reject(error);
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        log(pkg.name, pkg.color, `Process exited with code ${code}`);
        reject(new Error(`Process exited with code ${code}`));
      } else {
        log(pkg.name, pkg.color, 'Process completed successfully');
        resolve();
      }
    });

    // 存储子进程引用以便后续清理
    pkg.process = child;
  });
}

// 清理函数
function cleanup() {
  console.log('\n\x1b[31mShutting down development environment...\x1b[0m');
  
  packages.forEach(pkg => {
    if (pkg.process) {
      log(pkg.name, pkg.color, 'Stopping process...');
      pkg.process.kill('SIGTERM');
    }
  });

  // 强制退出
  setTimeout(() => {
    console.log('\x1b[31mForce exiting...\x1b[0m');
    process.exit(0);
  }, 2000);
}

// 主函数
async function main() {
  console.log('\x1b[1m\x1b[32m🚀 Starting UCC Blog Development Environment\x1b[0m\n');
  
  // 注册清理函数
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  try {
    // 并行启动所有包
    const promises = packages.map(pkg => startPackage(pkg));
    
    // 等待所有包启动完成
    await Promise.all(promises);
    
    console.log('\n\x1b[1m\x1b[32m✅ All packages started successfully!\x1b[0m');
    console.log('\x1b[33mPress Ctrl+C to stop all processes\x1b[0m\n');
    
    // 保持进程运行
    await new Promise(() => {});
    
  } catch (error) {
    console.error('\x1b[31m❌ Failed to start development environment:\x1b[0m', error.message);
    cleanup();
    process.exit(1);
  }
}

// 启动主函数
main().catch(error => {
  console.error('\x1b[31m❌ Unexpected error:\x1b[0m', error);
  process.exit(1);
});
