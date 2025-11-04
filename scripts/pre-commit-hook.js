#!/usr/bin/env node

/**
 * Git pre-commit hook
 * 在提交前自动更新 Service Worker 版本号（基于 UTC+8 时区）
 */

import { execSync } from 'child_process'
import { resolve } from 'path'

const SW_UPDATE_SCRIPT = resolve(process.cwd(), 'scripts/update-sw-version.js')

try {
  // 运行版本号更新脚本
  execSync(`node ${SW_UPDATE_SCRIPT}`, { stdio: 'inherit' })

  // 将更新后的 sw.js 添加到暂存区
  execSync('git add public/sw.js', { stdio: 'inherit' })

  console.log('✅ Service Worker 版本号已更新并添加到提交')
} catch (error) {
  console.error('❌ Pre-commit hook 执行失败:', error.message)
  process.exit(1)
}

