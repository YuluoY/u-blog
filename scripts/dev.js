#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const gulp = require('gulp');
const fs = require('node:fs')

const root = path.dirname(__dirname)

const packages = [
  {
    name: 'model',
    root: path.join(root, 'packages', 'model'),  // 包根目录
    src: path.join(root, 'packages', 'model', 'src'),  // 源码目录
    watch: ['**/*.ts'],
    command: 'pnpm',
    argv: ['run', 'build']
  },
  {
    name: 'ui',
    root: path.join(root, 'packages', 'ui'),
    src: path.join(root, 'packages', 'ui', 'src'),
    watch: ['**/*.ts', '**/*.vue'],
    command: 'pnpm',
    argv: ['run', 'build:es']
  },
  {
    entry: 'index.ts',
    name: 'utils',
    root: path.join(root, 'packages', 'utils'),
    src: path.join(root, 'packages', 'utils', 'src'),
    watch: ['**/*.ts'],
    command: 'pnpm',
    argv: ['run', 'build']
  },
  {
    name: 'helper',
    root: path.join(root, 'packages', 'helper'),
    src: path.join(root, 'packages', 'helper', 'src'),
    watch: ['**/*.ts'],
    command: 'pnpm',
    argv: ['run', 'build']
  },
  {
    name: 'composables',
    root: path.join(root, 'packages', 'composables'),
    src: path.join(root, 'packages', 'composables', 'src'),
    watch: ['**/*.ts'],
    command: 'pnpm',
    argv: ['run', 'build']
  },
  {
    name: 'types',
    root: path.join(root, 'packages', 'types'),
    src: path.join(root, 'packages', 'types', 'src'),
    watch: ['**/*.ts'],
    command: 'pnpm',
    argv: ['run', 'build']
  },
  {
    name: 'frontend',
    root: path.join(root, 'apps', 'frontend'),
    src: path.join(root, 'apps', 'frontend', 'src'),
    command: 'pnpm',
    argv: ['run', 'dev'],
    // 不配置 watch，保持 Vite Dev Server 常驻运行
    logging: true
  },
  {
    name: 'backend',
    root: path.join(root, 'apps', 'backend'),
    src: path.join(root, 'apps', 'backend', 'src'),
    command: 'pnpm',
    argv: ['run', 'dev'],
    logging: true
  }
]

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

const building = new Map()
const buildTimers = new Map()
const buildDones = new Map()

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

// 关键：为每个包创建独立的 watch，使用绝对路径
const watchers = packages.map(pkg => {
  if (!pkg.watch)
  {
    debouncedBuild(pkg, _ => {
      console.log(`✅ ${pkg.name} 已启动`)
    })
    return null
  }
  const watchPaths = pkg.watch.map(pattern => {
    const fullPath = path.resolve(pkg.src, pattern)
    return fullPath
  })
  
  console.log(`👀 监听 ${pkg.name}`)
  console.log(`   📂 根目录: ${pkg.root}`)
  console.log(`   📝 监听模式: ${pkg.watch.join(', ')}`)
  console.log(`   🔗 绝对路径: ${watchPaths.join(', ')}`)
  
  const watcher = gulp.watch(watchPaths, (done) => {
    console.log(`📝 检测到 ${pkg.name} 目录下的文件变化`)
    debouncedBuild(pkg, done)
  })
  
  watcher.on('ready', () => {
    console.log(`✅ ${pkg.name} 监听器已就绪`)
  })
  
  watcher.on('change', (filePath) => {
    console.log(`📝 ${pkg.name} 文件变化: ${filePath}`)
    debouncedBuild(pkg, null)
  })
  
  watcher.on('error', (err) => {
    console.error(`❌ ${pkg.name} 监听器错误:`, err)
  })
  
  return watcher
})

console.log(`\n🎯 共创建 ${watchers.length} 个文件监听器\n`)
