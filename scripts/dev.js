#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const net = require('node:net');

const root = path.dirname(__dirname);

const BACKEND_PORT = 3000;

const buildPackages = [
  { name: 'model', root: path.join(root, 'packages', 'model'), command: 'pnpm', argv: ['run', 'dev'], logging: true },
  { name: 'ui', root: path.join(root, 'packages', 'ui'), command: 'pnpm', argv: ['run', 'dev'], logging: true },
  { name: 'utils', root: path.join(root, 'packages', 'utils'), command: 'pnpm', argv: ['run', 'dev'], logging: true },
  { name: 'helper', root: path.join(root, 'packages', 'helper'), command: 'pnpm', argv: ['run', 'dev'], logging: true },
  { name: 'composables', root: path.join(root, 'packages', 'composables'), command: 'pnpm', argv: ['run', 'dev'], logging: true },
  { name: 'types', root: path.join(root, 'packages', 'types'), command: 'pnpm', argv: ['run', 'dev'], logging: true },
];

const watchPackages = [
  { name: 'model', root: path.join(root, 'packages', 'model'), command: 'pnpm', argv: ['run', 'dev'], logging: false },
  { name: 'ui', root: path.join(root, 'packages', 'ui'), command: 'pnpm', argv: ['run', 'dev'], logging: false },
  { name: 'utils', root: path.join(root, 'packages', 'utils'), command: 'pnpm', argv: ['run', 'dev'], logging: false },
  { name: 'helper', root: path.join(root, 'packages', 'helper'), command: 'pnpm', argv: ['run', 'dev'], logging: false },
  { name: 'composables', root: path.join(root, 'packages', 'composables'), command: 'pnpm', argv: ['run', 'dev'], logging: false },
  { name: 'types', root: path.join(root, 'packages', 'types'), command: 'pnpm', argv: ['run', 'dev'], logging: false },
];

const backendPackage = {
  name: 'backend',
  root: path.join(root, 'apps', 'backend'),
  command: 'pnpm',
  argv: ['run', 'dev'],
  logging: true,
};

const appPackages = [
  { name: 'frontend', root: path.join(root, 'apps', 'frontend'), command: 'pnpm', argv: ['run', 'dev'], logging: true },
  { name: 'admin', root: path.join(root, 'apps', 'admin'), command: 'pnpm', argv: ['run', 'dev'], logging: true },
];

const serverProcesses = new Map();

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

function runServer(pkg, waitForBuild = false) {
  const child = spawn(pkg.command, pkg.argv, {
    cwd: pkg.root,
    stdio: pkg.logging ? 'inherit' : 'pipe',
    shell: false,
  });
  serverProcesses.set(pkg.name, child);
  child.on('exit', (code, signal) => {
    serverProcesses.delete(pkg.name);
    if (signal === 'SIGINT' || signal === 'SIGTERM') {
      return;
    }
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

function buildPackagesFirst() {
  return new Promise((resolve) => {
    console.log('🔨 正在预先构建 packages...\n');
    const buildProcesses = buildPackages.map((pkg) => {
      return spawn(pkg.command, ['run', 'build'], {
        cwd: pkg.root,
        stdio: 'inherit',
        shell: false,
      });
    });
    
    let completed = 0;
    buildProcesses.forEach((proc) => {
      proc.on('close', () => {
        completed++;
        if (completed === buildProcesses.length) {
          console.log('✅ packages 预先构建完成\n');
          resolve();
        }
      });
    });
  });
}

function killAllProcesses() {
  serverProcesses.forEach((child, name) => {
    if (child && !child.killed) {
      child.kill('SIGTERM');
      console.log(`🛑 ${name} 已终止`);
    }
  });
  serverProcesses.clear();
}

process.on('SIGINT', killAllProcesses);
process.on('SIGTERM', killAllProcesses);
process.on('exit', killAllProcesses);

(async () => {
  await buildPackagesFirst();
  
  console.log('🎯 启动 packages watch 模式...\n');
  watchPackages.forEach((pkg) => runServer(pkg));

  console.log('\n🔨 正在启动后端...');
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
