#!/usr/bin/env node

/**
 * 项目初始化脚本
 * 交互式配置项目名称、KV 绑定名称和 KV Namespace ID
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import readline from 'readline'
import { execSync, spawnSync } from 'child_process'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 询问函数
function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

// 验证输入
function validateProjectName(name) {
  if (!name || name.trim().length === 0) {
    return '项目名称不能为空'
  }
  // 项目名称应该符合 npm 包名规范
  if (!/^[a-z0-9][a-z0-9\-_]*$/.test(name.toLowerCase())) {
    return '项目名称只能包含小写字母、数字、连字符和下划线，且必须以字母或数字开头'
  }
  return null
}

function validateKVBinding(binding) {
  if (!binding || binding.trim().length === 0) {
    return 'KV 绑定名称不能为空'
  }
  // KV 绑定名称应该符合标识符规范
  if (!/^[A-Z][A-Z0-9_]*$/.test(binding)) {
    return 'KV 绑定名称应该为大写字母、数字和下划线，且必须以字母开头（推荐格式：APP_KV）'
  }
  return null
}

function validateKVId(id) {
  if (!id || id.trim().length === 0) {
    return 'KV Namespace ID 不能为空'
  }
  // KV ID 通常是十六进制字符串，长度在 16-64 之间
  const trimmed = id.trim()
  if (!/^[a-f0-9]+$/i.test(trimmed)) {
    return 'KV Namespace ID 应该只包含十六进制字符（0-9, a-f）'
  }
  if (trimmed.length < 16 || trimmed.length > 64) {
    return 'KV Namespace ID 长度应该在 16-64 位之间'
  }
  return null
}

// 检查 yes/no 回答
function isYes(answer) {
  const normalized = answer.trim().toLowerCase()
  return normalized === 'y' || normalized === 'yes' || normalized === '是'
}

// 检查 wrangler 是否已登录
function checkWranglerLogin() {
  try {
    execSync('wrangler whoami', { stdio: 'ignore' })
    return true
  } catch (error) {
    return false
  }
}

// 检查 GitHub CLI 是否已安装
function checkGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'ignore' })
    return true
  } catch (error) {
    return false
  }
}

// 检查 GitHub CLI 是否已登录
function checkGitHubLogin() {
  try {
    execSync('gh auth status', { stdio: 'ignore' })
    return true
  } catch (error) {
    return false
  }
}

// 检查是否已初始化 git 仓库
function isGitInitialized() {
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' })
    return true
  } catch (error) {
    return false
  }
}

// 检查是否已有远程仓库
function hasRemoteOrigin() {
  try {
    const output = execSync('git remote get-url origin', { encoding: 'utf-8', stdio: 'pipe' })
    return output.trim().length > 0
  } catch (error) {
    return false
  }
}

// 初始化 git 仓库
function initGitRepository() {
  try {
    if (!isGitInitialized()) {
      console.log('📦 正在初始化 Git 仓库...')
      execSync('git init', { stdio: 'inherit' })
      console.log('✅ Git 仓库初始化完成\n')
    }
    return true
  } catch (error) {
    console.error('❌ 初始化 Git 仓库失败:', error.message)
    return false
  }
}

// 创建 GitHub 仓库
async function createGitHubRepository(repoName, description = '', isPrivate = false) {
  try {
    const visibility = isPrivate ? '--private' : '--public'

    // 构建命令参数数组，避免 shell 注入
    const args = ['repo', 'create', repoName, visibility, '--source=.', '--remote=origin', '--push=false']

    if (description && description.trim()) {
      args.push('--description', description.trim())
    }

    console.log(`\n📦 正在创建 GitHub 仓库: ${repoName}...`)
    const result = spawnSync('gh', args, { stdio: 'inherit' })

    if (result.error) {
      throw result.error
    }

    if (result.status !== 0) {
      throw new Error(`命令执行失败，退出码: ${result.status}`)
    }

    console.log('✅ GitHub 仓库创建成功！')
    return true
  } catch (error) {
    console.error(`❌ 创建 GitHub 仓库失败:`, error.message)
    return false
  }
}

// 创建 KV Namespace
async function createKVNamespace(bindingName) {
  try {
    console.log(`\n📦 正在创建 KV Namespace: ${bindingName}...`)
    const output = execSync(`wrangler kv namespace create ${bindingName}`, {
      encoding: 'utf-8',
      stdio: 'pipe'
    })

    // 打印输出以便调试（但在成功时会隐藏）
    const fullOutput = output

    // 尝试多种格式匹配 ID
    // 格式1: JSON 格式 { "id": "xxx", "title": "xxx" }
    let idMatch = fullOutput.match(/"id"\s*:\s*"([a-f0-9]{16,64})"/i)
    if (idMatch) {
      return idMatch[1].trim()
    }

    // 格式2: "id": "xxx" 或 id: "xxx"
    idMatch = fullOutput.match(/id["\s:=]+["']?([a-f0-9]{16,64})["']?/i)
    if (idMatch) {
      return idMatch[1].trim()
    }

    // 格式3: 查找 32 位十六进制字符串（最常见的格式）
    idMatch = fullOutput.match(/\b([a-f0-9]{32})\b/i)
    if (idMatch) {
      return idMatch[1].trim()
    }

    // 格式4: 查找任何 16-64 位的十六进制字符串
    idMatch = fullOutput.match(/\b([a-f0-9]{16,64})\b/i)
    if (idMatch) {
      const candidate = idMatch[1].trim()
      // 验证长度是否合理（通常是 32 位）
      if (candidate.length >= 16 && candidate.length <= 64) {
        return candidate
      }
    }

    // 如果所有自动解析都失败，显示完整输出让用户手动查找
    console.log('⚠️  无法自动解析 KV Namespace ID，请从下面的输出中手动查找:')
    console.log('─'.repeat(50))
    console.log(fullOutput)
    console.log('─'.repeat(50))
    return null
  } catch (error) {
    // 检查是否是 KV 已存在的错误
    const errorOutput = (error.stdout || '') + (error.stderr || '')
    if (errorOutput.includes('already exists') || errorOutput.includes('已存在')) {
      console.log('⚠️  KV Namespace 已存在，无法自动获取 ID')
      console.log('💡 请运行以下命令查看现有 KV Namespace ID:')
      console.log(`   wrangler kv namespace list`)
      return null
    }

    console.error(`❌ 创建 KV Namespace 失败:`, error.message)
    if (error.stdout) {
      console.error('输出:', error.stdout)
    }
    if (error.stderr) {
      console.error('错误:', error.stderr)
    }
    return null
  }
}

// 替换文件内容
function replaceInFile(filePath, replacements) {
  try {
    let content = readFileSync(filePath, 'utf-8')
    replacements.forEach(({ pattern, replacement }) => {
      if (typeof pattern === 'string') {
        content = content.replace(new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement)
      } else {
        content = content.replace(pattern, replacement)
      }
    })
    writeFileSync(filePath, content, 'utf-8')
    return true
  } catch (error) {
    console.error(`❌ 更新文件 ${filePath} 失败:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 开始初始化项目...\n')

  // 1. 询问项目名称
  let projectName = ''
  while (true) {
    projectName = await question('请输入项目名称 (例如: my-awesome-app): ')
    const error = validateProjectName(projectName)
    if (!error) {
      break
    }
    console.log(`❌ ${error}\n`)
  }

  // 2. 询问 KV 绑定名称
  let kvBindingName = ''
  while (true) {
    kvBindingName = await question('请输入 KV 绑定名称 (例如: APP_KV): ')
    const error = validateKVBinding(kvBindingName)
    if (!error) {
      break
    }
    console.log(`❌ ${error}\n`)
  }

  // 3. 处理 KV Namespace ID
  let kvNamespaceId = ''

  // 检查是否已登录 wrangler
  const isLoggedIn = checkWranglerLogin()
  if (!isLoggedIn) {
    console.log('\n⚠️  检测到 wrangler 未登录')
    console.log('💡 请先运行: wrangler login')
    console.log('   然后重新运行: npm run init\n')
    rl.close()
    process.exit(1)
  }

  // 询问是否要创建新的 KV Namespace
  console.log('\n📦 KV Namespace 配置')
  const createKV = await question(`是否要创建新的 KV Namespace "${kvBindingName}"? (y/n): `)

  if (isYes(createKV)) {
    // 创建 KV Namespace
    const createdId = await createKVNamespace(kvBindingName)
    if (createdId) {
      kvNamespaceId = createdId
      console.log(`✅ KV Namespace 创建成功！`)
      console.log(`   ID: ${kvNamespaceId}\n`)
    } else {
      // 创建失败，要求手动输入
      console.log('\n⚠️  无法自动获取 KV Namespace ID')
      while (true) {
        kvNamespaceId = await question('请手动输入 KV Namespace ID (十六进制字符串): ')
        const error = validateKVId(kvNamespaceId)
        if (!error) {
          break
        }
        console.log(`❌ ${error}\n`)
      }
    }
  } else {
    // 使用现有的 KV Namespace
    console.log('\n💡 请提供现有的 KV Namespace ID')
    while (true) {
      kvNamespaceId = await question('请输入 KV Namespace ID (十六进制字符串): ')
      const error = validateKVId(kvNamespaceId)
      if (!error) {
        break
      }
      console.log(`❌ ${error}\n`)
    }
  }

  // 4. 处理 GitHub 仓库创建
  console.log('\n🐙 GitHub 仓库配置')
  let githubRepoCreated = false

  // 检查是否需要初始化 git
  if (!isGitInitialized()) {
    const initGit = await question('是否要初始化 Git 仓库? (y/n): ')
    if (isYes(initGit)) {
      if (!initGitRepository()) {
        console.log('⚠️  Git 仓库初始化失败，跳过 GitHub 仓库创建\n')
      }
    } else {
      console.log('💡 跳过 Git 仓库初始化\n')
    }
  }

  // 如果已初始化 git 且没有远程仓库，询问是否创建 GitHub 仓库
  if (isGitInitialized() && !hasRemoteOrigin()) {
    const hasGitHubCLI = checkGitHubCLI()

    if (hasGitHubCLI) {
      const isLoggedIn = checkGitHubLogin()
      if (!isLoggedIn) {
        console.log('⚠️  检测到 GitHub CLI 未登录')
        console.log('💡 请先运行: gh auth login')
        console.log('   然后可以手动创建仓库或重新运行 init 脚本\n')
      } else {
        const createRepo = await question('是否要创建 GitHub 仓库? (y/n): ')
        if (isYes(createRepo)) {
          // 询问仓库名称（默认使用项目名称）
          const repoName = await question(`请输入仓库名称 (默认: ${projectNameKebab}): `) || projectNameKebab

          // 询问是否为私有仓库
          const isPrivate = await question('是否为私有仓库? (y/n，默认: n): ')
          const privateRepo = isYes(isPrivate)

          // 询问仓库描述
          const description = await question('请输入仓库描述 (可选): ')

          githubRepoCreated = await createGitHubRepository(repoName, description.trim(), privateRepo)

          if (githubRepoCreated) {
            console.log('\n💡 下一步:')
            console.log('   1. 运行: git add .')
            console.log('   2. 运行: git commit -m "Initial commit"')
            console.log('   3. 运行: git push -u origin main (或 master)\n')
          }
        }
      }
    } else {
      console.log('💡 GitHub CLI (gh) 未安装，无法自动创建仓库')
      console.log('   安装方法: https://cli.github.com/')
      console.log('   或手动创建: https://github.com/new\n')
    }
  } else if (hasRemoteOrigin()) {
    console.log('✅ 检测到已配置远程仓库，跳过创建\n')
  }

  rl.close()

  console.log('\n📝 正在更新配置文件...\n')

  const projectNameLower = projectName.toLowerCase()
  const projectNameKebab = projectNameLower.replace(/_/g, '-')
  const projectNameSnake = projectNameLower.replace(/-/g, '_')

  let successCount = 0
  let failCount = 0

  // 更新 package.json
  console.log('  更新 package.json...')
  if (replaceInFile(resolve('package.json'), [
    { pattern: /"name":\s*"[^"]*"/, replacement: `"name": "${projectNameKebab}"` }
  ])) {
    console.log('  ✅ package.json 已更新')
    successCount++
  } else {
    failCount++
  }

  // 更新 wrangler.toml
  console.log('  更新 wrangler.toml...')
  if (replaceInFile(resolve('wrangler.toml'), [
    { pattern: /name\s*=\s*"[^"]*"/, replacement: `name = "${projectNameKebab}"` },
    { pattern: /binding\s*=\s*"[^"]*"/, replacement: `binding = "${kvBindingName}"` },
    { pattern: /id\s*=\s*"[^"]*"/, replacement: `id = "${kvNamespaceId.trim()}"` }
  ])) {
    console.log('  ✅ wrangler.toml 已更新')
    successCount++
  } else {
    failCount++
  }

  // 更新 functions/_shared/storage.js
  console.log('  更新 functions/_shared/storage.js...')
  if (replaceInFile(resolve('functions/_shared/storage.js'), [
    { pattern: /const KV_BINDING\s*=\s*'[^']*'/, replacement: `const KV_BINDING = '${kvBindingName}'` }
  ])) {
    console.log('  ✅ functions/_shared/storage.js 已更新')
    successCount++
  } else {
    failCount++
  }

  // 更新 public/sw.js
  console.log('  更新 public/sw.js...')
  if (replaceInFile(resolve('public/sw.js'), [
    { pattern: /const PROJECT_NAME\s*=\s*'[^']*'/, replacement: `const PROJECT_NAME = '${projectNameSnake}'` }
  ])) {
    console.log('  ✅ public/sw.js 已更新')
    successCount++
  } else {
    failCount++
  }

  // 更新 scripts/update-sw-version.js
  console.log('  更新 scripts/update-sw-version.js...')
  if (replaceInFile(resolve('scripts/update-sw-version.js'), [
    { pattern: /const PROJECT_NAME\s*=\s*'[^']*'/, replacement: `const PROJECT_NAME = '${projectNameSnake}'` }
  ])) {
    console.log('  ✅ scripts/update-sw-version.js 已更新')
    successCount++
  } else {
    failCount++
  }

  // 更新 dev.sh
  console.log('  更新 dev.sh...')
  if (replaceInFile(resolve('dev.sh'), [
    { pattern: /PROJECT_URL="[^"]*"/, replacement: `PROJECT_URL="https://${projectNameKebab}.pages.dev"` },
    { pattern: /wrangler pages dev dist --kv \w+/, replacement: `wrangler pages dev dist --kv ${kvBindingName}` }
  ])) {
    console.log('  ✅ dev.sh 已更新')
    successCount++
  } else {
    failCount++
  }

  // 更新 public/manifest.json
  console.log('  更新 public/manifest.json...')
  if (replaceInFile(resolve('public/manifest.json'), [
    { pattern: /"name":\s*"[^"]*"/, replacement: `"name": "${projectName}"` },
    { pattern: /"short_name":\s*"[^"]*"/, replacement: `"short_name": "${projectName.substring(0, 12)}"` }
  ])) {
    console.log('  ✅ public/manifest.json 已更新')
    successCount++
  } else {
    failCount++
  }

  console.log('\n' + '='.repeat(50))
  if (failCount === 0) {
    console.log(`✅ 初始化完成！已成功更新 ${successCount} 个文件\n`)
    console.log('📋 配置摘要:')
    console.log(`   项目名称: ${projectName}`)
    console.log(`   KV 绑定: ${kvBindingName}`)
    console.log(`   KV Namespace ID: ${kvNamespaceId.trim()}\n`)
    console.log('💡 下一步:')
    console.log('   1. 检查配置文件是否正确')
    console.log('   2. 运行 npm install 安装依赖')
    if (githubRepoCreated) {
      console.log('   3. 运行: git add .')
      console.log('   4. 运行: git commit -m "Initial commit"')
      console.log('   5. 运行: git push -u origin main (或 master)')
      console.log('   6. 运行 npm run dev 开始开发\n')
    } else {
      console.log('   3. 运行 npm run dev 开始开发\n')
    }
  } else {
    console.log(`⚠️  部分文件更新失败，请手动检查\n`)
    process.exit(1)
  }
}

main().catch(error => {
  console.error('❌ 初始化失败:', error.message)
  process.exit(1)
})

