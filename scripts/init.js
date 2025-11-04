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

  // 0. 前置检查：登录状态
  console.log('📋 前置检查...')
  let needsWranglerLogin = false
  let needsGitHubLogin = false

  if (!checkWranglerLogin()) {
    console.log('⚠️  Cloudflare (wrangler) 未登录')
    console.log('💡 如需自动创建 KV Namespace，请先运行: wrangler login')
    needsWranglerLogin = true
  } else {
    console.log('✅ Cloudflare (wrangler) 已登录')
  }

  if (checkGitHubCLI()) {
    if (!checkGitHubLogin()) {
      console.log('⚠️  GitHub CLI 未登录')
      console.log('💡 如需自动创建 GitHub 仓库，请先运行: gh auth login')
      needsGitHubLogin = true
    } else {
      console.log('✅ GitHub CLI 已登录')
    }
  } else {
    console.log('💡 GitHub CLI 未安装（可选，用于自动创建 GitHub 仓库）')
  }

  if (needsWranglerLogin || needsGitHubLogin) {
    console.log('\n💡 提示: 可以继续初始化，稍后手动配置这些选项')
    const continueAnyway = await question('是否继续初始化? (y/n): ')
    if (!isYes(continueAnyway)) {
      console.log('\n👋 初始化已取消')
      rl.close()
      process.exit(0)
    }
    console.log('')
  } else {
    console.log('✅ 所有前置检查通过\n')
  }

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

  // 询问是否要创建新的 KV Namespace
  console.log('\n📦 KV Namespace 配置')
  const createKV = await question(`是否要创建新的 KV Namespace "${kvBindingName}"? (y/n): `)

  if (isYes(createKV)) {
    // 检查是否已登录
    if (!checkWranglerLogin()) {
      console.log('\n⚠️  wrangler 未登录，无法自动创建 KV Namespace')
      console.log('💡 请先运行: wrangler login')
      console.log('   然后手动创建 KV 或重新运行 init 脚本\n')
      // 要求手动输入
      while (true) {
        kvNamespaceId = await question('请手动输入 KV Namespace ID (十六进制字符串): ')
        const error = validateKVId(kvNamespaceId)
        if (!error) {
          break
        }
        console.log(`❌ ${error}\n`)
      }
    } else {
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
  let shouldAutoCommit = false  // 记录是否需要自动提交

  // 先计算项目名称的转换形式（用于后续使用）
  const projectNameLower = projectName.toLowerCase()
  const projectNameKebab = projectNameLower.replace(/_/g, '-')
  const projectNameSnake = projectNameLower.replace(/-/g, '_')

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

          // 询问是否为私有仓库（默认私有）
          const isPrivate = await question('是否为私有仓库? (y/n，默认: y): ')
          const privateRepo = isPrivate.trim() === '' || isYes(isPrivate)

          // 询问仓库描述
          const description = await question('请输入仓库描述 (可选): ')

          githubRepoCreated = await createGitHubRepository(repoName, description.trim(), privateRepo)

          if (githubRepoCreated) {
            // 询问是否要自动提交首次更新（稍后在配置文件更新后执行）
            const autoCommit = await question('是否要自动提交并推送首次更新? (y/n，默认: y): ')
            shouldAutoCommit = autoCommit.trim() === '' || isYes(autoCommit)
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

  // 5. 设置 Git Hooks（默认设置）
  if (isGitInitialized()) {
    console.log('🔧 Git Hooks 配置')
    const setupHooks = await question('是否要设置 Git hooks（自动更新 Service Worker 版本号）? (y/n，默认: y): ')
    const shouldSetupHooks = setupHooks.trim() === '' || isYes(setupHooks)

    if (shouldSetupHooks) {
      try {
        console.log('\n📦 正在设置 Git hooks...')
        execSync('npm run setup:hooks', { stdio: 'inherit' })
        console.log('✅ Git hooks 设置完成\n')
      } catch (error) {
        console.log('⚠️  Git hooks 设置失败，可以稍后手动运行: npm run setup:hooks\n')
      }
    } else {
      console.log('💡 跳过 Git hooks 设置\n')
    }
  }

  rl.close()

  console.log('\n📦 正在安装依赖...')
  try {
    execSync('npm install', { stdio: 'inherit' })
    console.log('✅ 依赖安装完成\n')
  } catch (error) {
    console.log('⚠️  依赖安装失败，请稍后手动运行: npm install\n')
  }

  console.log('\n📝 正在更新配置文件...\n')

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

  // 更新 package-lock.json（如果存在）
  const packageLockPath = resolve('package-lock.json')
  try {
    readFileSync(packageLockPath, 'utf-8') // 检查文件是否存在
    console.log('  更新 package-lock.json...')
    if (replaceInFile(packageLockPath, [
      { pattern: /"name":\s*"[^"]*"/, replacement: `"name": "${projectNameKebab}"` }
    ])) {
      console.log('  ✅ package-lock.json 已更新')
      successCount++
    } else {
      failCount++
    }
  } catch (error) {
    // 文件不存在，跳过（npm install 会自动生成）
    if (error.code !== 'ENOENT') {
      console.log(`  ⚠️  跳过 package-lock.json: ${error.message}`)
    }
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

  // 更新 src/components/Splash.vue（如果存在）
  const splashPath = resolve('src/components/Splash.vue')
  try {
    let splashContent = readFileSync(splashPath, 'utf-8') // 检查文件是否存在
    console.log('  更新 src/components/Splash.vue...')

    // 替换所有 your-project 相关的字符串
    // 1. key.includes('your-project-')
    splashContent = splashContent.replace(/key\.includes\(['"]your-project-/g, `key.includes('${projectNameSnake}-`)

    // 2. 正则表达式中的 your-project-(\d{8}-\d{4}) - 匹配模式
    splashContent = splashContent.replace(/your-project-\(\\d\{8\}-\\d\{4\}\)/g, `${projectNameSnake}-(\\d{8}-\\d{4})`)

    // 3. 字符串中的 your-project-(\d{8}-\d{4}) - 实际匹配
    splashContent = splashContent.replace(/your-project-(\d{8}-\d{4})/g, `${projectNameSnake}-$1`)

    // 4. 正则表达式中的 your-project-[\w-]+
    splashContent = splashContent.replace(/your-project-\[\\w-\]\+/g, `${projectNameSnake}-[\\w-]+`)

    // 5. 字符串中的 'your-project-'
    splashContent = splashContent.replace(/['"]your-project-/g, `'${projectNameSnake}-`)

    writeFileSync(splashPath, splashContent, 'utf-8')
    console.log('  ✅ src/components/Splash.vue 已更新')
    successCount++
  } catch (error) {
    // 文件不存在，跳过
    if (error.code === 'ENOENT') {
      // 文件不存在，静默跳过
    } else {
      console.log(`  ⚠️  跳过 src/components/Splash.vue: ${error.message}`)
      failCount++
    }
  }

  // 如果创建了 GitHub 仓库且用户选择了自动提交，现在执行提交
  if (githubRepoCreated && shouldAutoCommit) {
    try {
      console.log('\n📦 正在提交并推送代码...')
      execSync('git add .', { stdio: 'inherit' })
      execSync('git commit -m "Initial commit"', { stdio: 'inherit' })

      // 尝试推送，先试试 main 分支，如果失败再试试 master
      try {
        execSync('git push -u origin main', { stdio: 'inherit' })
      } catch (error) {
        try {
          execSync('git push -u origin master', { stdio: 'inherit' })
        } catch (error2) {
          console.log('⚠️  推送失败，请检查分支名称并手动推送\n')
        }
      }
      console.log('✅ 代码已成功提交并推送\n')
    } catch (error) {
      console.log('⚠️  自动提交失败，请稍后手动运行:')
      console.log('   git add .')
      console.log('   git commit -m "Initial commit"')
      console.log('   git push -u origin main (或 master)\n')
    }
  }

  console.log('\n' + '='.repeat(50))
  if (failCount === 0) {
    console.log(`✅ 初始化完成！已成功更新 ${successCount} 个文件\n`)
    console.log('📋 配置摘要:')
    console.log(`   项目名称: ${projectName}`)
    console.log(`   KV 绑定: ${kvBindingName}`)
    console.log(`   KV Namespace ID: ${kvNamespaceId.trim()}\n`)
    console.log('💡 下一步:')
    // 检查是否已经推送过代码
    let alreadyPushed = false
    if (githubRepoCreated) {
      try {
        const branchStatus = execSync('git status -sb', { encoding: 'utf-8', stdio: 'pipe' })
        if (branchStatus.includes('ahead')) {
          // 有未推送的提交
        } else if (branchStatus.includes('up to date') || branchStatus.includes('up-to-date')) {
          alreadyPushed = true
        }
      } catch (error) {
        // 忽略错误，继续显示提示
      }

      if (!alreadyPushed) {
        console.log('   1. 运行: git add .')
        console.log('   2. 运行: git commit -m "Initial commit"')
        console.log('   3. 运行: git push -u origin main (或 master)')
        console.log('   4. 运行 npm run dev 开始开发\n')
      } else {
        console.log('   1. 运行 npm run dev 开始开发\n')
      }
    } else {
      console.log('   1. 运行 npm run dev 开始开发\n')
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

