#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const net = require('node:net');
const gulp = require('gulp');
const fs = require('node:fs');

const root = path.dirname(__dirname);

/** 后端监听端口，与 apps/backend 配置一致 */
const BACKEND_PORT = 3000;

/** 仅构建的包（有 watch） */
const buildPackages = [
  { name: 'model', root: path.join(root, 'packages', 'model'), src: path.join(root, 'packages', 'model', 'src'), watch: ['**/*.ts'], command: 'pnpm', argv: ['run', 'build'] },
  { name: 'ui', root: path.join(root, 'packages', 'ui'), src: path.join(root, 'packages', 'ui', 'src'), watch: ['**/*.ts', '**/*.vue'], command: 'pnpm', argv: ['run', 'build:es'] },
  { name: 'utils', root: path.join(root, 'packages', 'utils'), src: path.join(root, 'packages', 'utils', 'src'), watch: ['**/*.ts'], command: 'pnpm', argv: ['run', 'build'] },
  { name: 'helper', root: path.join(root, 'packages', 'helper'), src: path.join(root, 'packages', 'helper', 'src'), watch: ['**/*.ts'], command: 'pnpm', argv: ['run', 'build'] },
  { name: 'composables', root: path.join(root, 'packages', 'composables'), src: path.join(root, 'packages', 'composables', 'src'), watch: ['**/*.ts'], command: 'pnpm', argv: ['run', 'build'] },
  { name: 'types', root: path.join(root, 'packages', 'types'), src: path.join(root, 'packages', 'types', 'src'), watch: ['**/*.ts'], command: 'pnpm', argv: ['run', 'build'] },
];

/** 后端：先启动，等端口就绪后再启动前端/后台 */
const backendPackage = {
  name: 'backend',
  root: path.join(root, 'apps', 'backend'),
  src: path.join(root, 'apps', 'backend', 'src'),
  command: 'pnpm',
  argv: ['run', 'dev'],
  logging: true,
};

/** 前端与后台（等后端就绪后并行启动） */
const appPackages = [
  { name: 'frontend', root: path.join(root, 'apps', 'frontend'), src: path.join(root, 'apps', 'frontend', 'src'), command: 'pnpm', argv: ['run', 'dev'], logging: true },
  { name: 'admin', root: path.join(root, 'apps', 'admin'), src: path.join(root, 'apps', 'admin', 'src'), command: 'pnpm', argv: ['run', 'dev'], logging: true },
];

/** 合并为 packages，供下方 watch/clean 等逻辑使用 */
const packages = [...buildPackages, backendPackage, ...appPackages];

const Icons = {
  '✅': '✅', // 成功
  '🔄': '🔄', // 构建中
  '🛑': '🛑', // 终止
  '❌': '❌', // 失败
  '👀': '👀', // 监听
  '📂': '📂', // 目录
  '📝': '📝', // 日志
  '🔗': '🔗', // 链接
  '🎯': '🎯', // 目标
  '🔨': '🔨', // 构建
  '⚠️': '⚠️', // 警告
  '🚨': '🚨', // 错误
  '🚫': '🚫'  // 禁止
}

const building = new Map();
const buildTimers = new Map();
const buildDones = new Map();
const serverProcesses = new Map();

/**
 * 等待端口可连接（用于后端就绪后再启动前端/后台）
 * @param {number} port
 * @param {number} timeoutMs
 * @returns {Promise<void>}
 */
function waitForPort(port, timeoutMs = 60000) {
  const step = 500;
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function tryConnect() {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`等待 localhost:${port} 就绪超时（${timeoutMs}ms）`));
        return;
      }
      const socket = net.createConnection(port, '127.0.0.1', () => {
        socket.destroy();
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        setTimeout(tryConnect, step);
      });
    }
    tryConnect();
  });
}

/**
 * 启动常驻进程（后端/前端/admin），不参与 watch 构建
 */
function runServer(pkg) {
  const child = spawn(pkg.command, pkg.argv, {
    cwd: pkg.root,
    stdio: pkg.logging ? 'inherit' : 'pipe',
    shell: false,
  });
  serverProcesses.set(pkg.name, child);
  child.on('exit', (code, signal) => {
    serverProcesses.delete(pkg.name);
    if (code !== 0 && code != null) {
      console.error(`❌ ${pkg.name} 进程退出，code=${code} signal=${signal}`);
    }
  });
  child.on('error', (err) => {
    console.error(`❌ ${pkg.name} 启动失败: ${err.message}`);
    serverProcesses.delete(pkg.name);
  });
  console.log(`✅ ${pkg.name} 已启动`);
  return child;
}

function clean(pkg) {
  if (pkg) {
    const distPath = path.join(pkg.root, 'dist')
    if (fs.existsSync(distPath)) {
      try {
        fs.rmSync(distPath, { recursive: true, force: true })
      } catch (err) {
        // 忽略清理错误
        console.warn(`⚠️  ${pkg.name} 清理警告: ${err.message}`)
      }
    }
  } else {
    packages.forEach(pkg => clean(pkg))
  }
}

function build(pkg, done) {
  // ✅ 三重检查：在构建函数中再次检查并 kill
  if (building.has(pkg)) {
    const process = building.get(pkg)
    if (process && !process.killed) {
      console.log(`🛑 ${pkg.name} 构建前检测到旧进程，强制终止`)
      try {
        process.kill()
      } catch (err) {
        // 忽略错误
      }
      building.delete(pkg)
      // 等待一小段时间确保进程终止
      setTimeout(() => {
        doBuild(pkg, done)
      }, 50)
      return
    }
    building.delete(pkg)
  }

  doBuild(pkg, done)
}

function doBuild(pkg, done) {
  clean(pkg)
  !pkg.logging && console.log(`🔄 ${pkg.name} 文件发生变化，开始构建...`)

  const spawner = spawn(pkg.command, pkg.argv, {
    cwd: pkg.root,
    stdio: pkg.logging ? 'inherit' : 'pipe',
    shell: false
  })

  building.set(pkg, spawner)

  spawner.on('spawn', () => {
    console.time(`${pkg.name}构建`)
    console.log(`🔨 开始构建 ${pkg.name}...`)
  })

  spawner.on('exit', (code, signal) => {
    console.timeEnd(`${pkg.name}构建`)
    
    // 检查是否被手动终止
    if (signal === 'SIGTERM' || signal === 'SIGKILL') {
      console.log(`⚠️  ${pkg.name} 构建被终止`)
    } else if (code === 0) {
      console.log(`✅ ${pkg.name} 构建成功`)
    } else {
      console.error(`❌ ${pkg.name} 构建失败，退出码: ${code}`)
    }
    
    building.delete(pkg)
    
    // 检查是否有待执行的 done 回调
    const pendingDone = buildDones.get(pkg)
    if (pendingDone) {
      buildDones.delete(pkg)
      pendingDone()
    } else {
      done?.()
    }
  })

  spawner.on('error', err => {
    console.error(`❌ ${pkg.name} 构建失败：${err.message}`)
    building.delete(pkg)
    
    const pendingDone = buildDones.get(pkg)
    if (pendingDone) {
      buildDones.delete(pkg)
      pendingDone(err)
    } else {
      done?.(err)
    }
  })
}

// 防抖版本的构建函数
function debouncedBuild(pkg, done) {
  if (building.has(pkg)) {
    const process = building.get(pkg)
    if (process && !process.killed) {
      console.log(`🛑 ${pkg.name} 检测到新文件变化，终止正在进行的构建`)
      try {
        process.kill()
      } catch (err) {
        // 忽略错误
      }
      building.delete(pkg)
    }
  }

  if (buildTimers.has(pkg)) {
    clearTimeout(buildTimers.get(pkg))
    buildDones.get(pkg)?.()
    buildDones.delete(pkg)
  }

  const timer = setTimeout(() => {
    buildTimers.delete(pkg)
    buildDones.delete(pkg)
    
    if (building.has(pkg)) {
      const process = building.get(pkg)
      if (process && !process.killed) {
        console.log(`🛑 ${pkg.name} 防抖结束，但检测到构建仍在进行，终止`)
        try {
          process.kill()
        } catch (err) {
          // 忽略错误
        }
        building.delete(pkg)
        setTimeout(() => {
          build(pkg, done)
        }, 100)
        return
      }
      building.delete(pkg)
    }
    
    build(pkg, done)
  }, 300)

  buildTimers.set(pkg, timer)
  buildDones.set(pkg, done)
}

// 1) 仅为「构建包」创建 watch
const watchers = buildPackages.map((pkg) => {
  const watchPaths = pkg.watch.map((pattern) => path.resolve(pkg.src, pattern));
  console.log(`👀 监听 ${pkg.name}   📂 ${pkg.root}`);
  const watcher = gulp.watch(watchPaths, (done) => {
    console.log(`📝 检测到 ${pkg.name} 目录下的文件变化`);
    debouncedBuild(pkg, done);
  });
  watcher.on('ready', () => console.log(`✅ ${pkg.name} 监听器已就绪`));
  watcher.on('change', (filePath) => {
    console.log(`📝 ${pkg.name} 文件变化: ${filePath}`);
    debouncedBuild(pkg, null);
  });
  watcher.on('error', (err) => console.error(`❌ ${pkg.name} 监听器错误:`, err));
  return watcher;
});

console.log(`\n🎯 共创建 ${watchers.length} 个文件监听器\n`);

// 2) 先启动后端，等端口就绪后再启动前端、后台
(async () => {
  console.log('🔨 正在启动后端...');
  runServer(backendPackage);
  try {
    await waitForPort(BACKEND_PORT);
    console.log(`✅ 后端已就绪 (localhost:${BACKEND_PORT})，启动前端与后台...\n`);
    appPackages.forEach((pkg) => runServer(pkg));
  } catch (err) {
    console.error('🚨', err.message);
    console.error('   请确认后端已能正常启动并监听端口', BACKEND_PORT);
  }
})();

// Ctrl+C 时结束所有已启动的后端/前端/admin 进程
function killServerProcesses() {
  serverProcesses.forEach((child, name) => {
    if (child && !child.killed) {
      child.kill();
      console.log(`🛑 ${name} 已终止`);
    }
  });
  serverProcesses.clear();
}
process.on('SIGINT', killServerProcesses);
process.on('SIGTERM', killServerProcesses);
