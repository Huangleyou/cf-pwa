#!/usr/bin/env node

/**
 * 自动更新 Service Worker 版本号
 * 使用日期时间生成版本号（UTC+8 时区，中国标准时间）
 *
 * 使用说明:
 * 1. 修改下面的 PROJECT_NAME 为你的项目名称
 * 2. 版本号格式: PROJECT_NAME-YYYYMMDD-HHmm
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// TODO: 修改为你的项目名称（与 sw.js 中的 PROJECT_NAME 一致）
const PROJECT_NAME = 'your-project'
const SW_PATH = resolve(process.cwd(), 'public/sw.js')

try {
  // 生成基于日期时间的版本号
  // 格式: YYYYMMDD-HHmm (例如: 20240115-1430)
  // 使用 UTC+8 时区（中国标准时间）
  const now = new Date()

  // 使用 Intl.DateTimeFormat 获取 UTC+8 时区的格式化时间
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  // 格式化日期时间字符串，例如: "11/03/2025, 04:10"
  const parts = formatter.formatToParts(now)
  const dateTimeMap = {}
  parts.forEach(part => {
    dateTimeMap[part.type] = part.value
  })

  const year = dateTimeMap.year
  const month = dateTimeMap.month
  const day = dateTimeMap.day
  const hours = dateTimeMap.hour
  const minutes = dateTimeMap.minute

  // 版本号格式: PROJECT_NAME-YYYYMMDD-HHmm (UTC+8 时区)
  const cacheVersion = `${PROJECT_NAME}-${year}${month}${day}-${hours}${minutes}`

  // 读取 Service Worker 文件
  let swContent = readFileSync(SW_PATH, 'utf-8')

  // 替换版本号（匹配各种可能的格式）
  // 匹配: const CACHE_NAME = 'PROJECT_NAME-YYYYMMDD-HHmm' 或 const CACHE_NAME = `${PROJECT_NAME}-YYYYMMDD-HHmm`
  const escapedProjectName = PROJECT_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // 匹配字符串字面量格式
  const cacheNameLiteralPattern = new RegExp(`const CACHE_NAME\\s*=\\s*['"]${escapedProjectName}-[\\w-]+['"]`, 'g')
  // 匹配模板字符串格式 - 注意：在正则表达式中需要转义反引号和 ${
  const cacheNameTemplatePattern = /const CACHE_NAME\s*=\s*`\$\{PROJECT_NAME\}-\d{8}-\d{4}`/g

  // 先尝试匹配模板字符串格式
  if (cacheNameTemplatePattern.test(swContent)) {
    cacheNameTemplatePattern.lastIndex = 0 // 重置 lastIndex
    swContent = swContent.replace(
      cacheNameTemplatePattern,
      `const CACHE_NAME = \`\${PROJECT_NAME}-${year}${month}${day}-${hours}${minutes}\``
    )
  } else if (cacheNameLiteralPattern.test(swContent)) {
    cacheNameLiteralPattern.lastIndex = 0 // 重置 lastIndex
    // 再尝试匹配字符串字面量格式
    swContent = swContent.replace(
      cacheNameLiteralPattern,
      `const CACHE_NAME = '${cacheVersion}'`
    )
  }

  // 匹配: const RUNTIME_CACHE = 'PROJECT_NAME-runtime-YYYYMMDD-HHmm' 或 const RUNTIME_CACHE = `${PROJECT_NAME}-runtime-YYYYMMDD-HHmm`
  const runtimeCacheLiteralPattern = new RegExp(`const RUNTIME_CACHE\\s*=\\s*['"]${escapedProjectName}-runtime-[\\w-]+['"]`, 'g')
  const runtimeCacheTemplatePattern = /const RUNTIME_CACHE\s*=\s*`\$\{PROJECT_NAME\}-runtime-\d{8}-\d{4}`/g

  // 先尝试匹配模板字符串格式
  if (runtimeCacheTemplatePattern.test(swContent)) {
    runtimeCacheTemplatePattern.lastIndex = 0 // 重置 lastIndex
    swContent = swContent.replace(
      runtimeCacheTemplatePattern,
      `const RUNTIME_CACHE = \`\${PROJECT_NAME}-runtime-${year}${month}${day}-${hours}${minutes}\``
    )
  } else if (runtimeCacheLiteralPattern.test(swContent)) {
    runtimeCacheLiteralPattern.lastIndex = 0 // 重置 lastIndex
    // 再尝试匹配字符串字面量格式
    swContent = swContent.replace(
      runtimeCacheLiteralPattern,
      `const RUNTIME_CACHE = '${PROJECT_NAME}-runtime-${year}${month}${day}-${hours}${minutes}'`
    )
  }

  // 写入文件
  writeFileSync(SW_PATH, swContent, 'utf-8')

  const timeString = `${year}-${month}-${day} ${hours}:${minutes}`
  console.log(`✅ Service Worker 版本号已更新: ${cacheVersion}`)
  console.log(`   时间: ${timeString}`)
} catch (error) {
  console.error('❌ 更新 Service Worker 版本号失败:', error.message)
  process.exit(1)
}

