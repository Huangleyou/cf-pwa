# Cloudflare Pages + PWA 脚手架

现代化的 Vue 3 + Cloudflare Pages + PWA 项目脚手架，包含完整的 CI/CD 自动化部署流程。

## ✨ 特性

- 🚀 **Cloudflare Pages Functions** - 无服务器后端 API
- 💾 **Cloudflare KV** - 键值存储支持
- 📱 **PWA 支持** - Service Worker 自动更新机制
- 🔄 **自动版本管理** - Git hooks 自动更新 Service Worker 版本号
- ⚙️ **CI/CD 自动化** - GitHub Actions 自动部署
- 🔧 **本地开发工具** - 支持本地/远程开发模式

## 🚀 快速开始

### 1. 初始化项目

```bash
# 复制脚手架到新项目目录
cp -r cf-pwa your-project-name
cd your-project-name

# 安装依赖
npm install

# 运行初始化脚本（推荐）
npm run init
```

初始化脚本会交互式询问以下信息：
- **项目名称**: 例如 `my-awesome-app`
- **KV 绑定名称**: 例如 `APP_KV`（必须为大写字母、数字和下划线）
- **KV Namespace**:
  - 选择创建新的 KV Namespace（脚本会自动创建并获取 ID）
  - 或提供现有的 KV Namespace ID
- **Git 仓库**:
  - 可选择初始化 Git 仓库
  - 可选择创建 GitHub 仓库（需要 GitHub CLI）

**前置要求**:
- **Cloudflare**: 使用 KV 自动创建功能前，请确保已登录：
  ```bash
  wrangler login
  ```
- **GitHub**: 使用 GitHub 仓库自动创建功能前，请确保已安装并登录 GitHub CLI：
  ```bash
  # 安装 GitHub CLI
  # macOS: brew install gh
  # 其他系统: https://cli.github.com/

  # 登录 GitHub
  gh auth login
  ```

脚本会自动更新以下配置文件：
- `package.json` - 项目名称
- `wrangler.toml` - 项目名称、KV 绑定和 ID
- `functions/_shared/storage.js` - KV 绑定名称
- `public/sw.js` - 项目名称
- `scripts/update-sw-version.js` - 项目名称
- `dev.sh` - 项目 URL 和 KV 绑定
- `public/manifest.json` - 应用名称

**可选功能**:
- 自动初始化 Git 仓库
- 自动创建 GitHub 仓库（使用 GitHub CLI）

### 2. 手动配置（如果未使用 init 脚本）

#### 2.1 修改项目名称

在以下文件中将 `your-project` 或 `your-project-name` 替换为你的项目名称：

- `package.json` - `name` 字段
- `wrangler.toml` - `name` 字段
- `public/sw.js` - `PROJECT_NAME` 常量
- `scripts/update-sw-version.js` - `PROJECT_NAME` 常量
- `dev.sh` - `PROJECT_URL` 变量
- `.github/workflows/deploy.yml` - `projectName` 字段（如果存在）
- `public/manifest.json` - 应用名称和描述

#### 2.2 配置 Cloudflare KV

如果使用 `npm run init` 脚本，KV 配置会自动完成。如果手动配置：

```bash
# 登录 Cloudflare
wrangler login

# 创建 KV Namespace
wrangler kv namespace create APP_KV

# 将输出的 ID 填入 wrangler.toml
# [[kv_namespaces]]
# binding = "APP_KV"
# id = "你的-KV-ID"
```

#### 2.3 配置 KV 绑定名称

在 `functions/_shared/storage.js` 中修改 `KV_BINDING` 常量（默认: `APP_KV`），确保与 `wrangler.toml` 中的 `binding` 一致。

**提示**: 使用 `npm run init` 可以自动完成以上所有配置。

### 3. 设置 Git Hooks（可选）

```bash
npm run setup:hooks
```

这将设置 Git pre-commit hook，每次提交时自动更新 Service Worker 版本号。

### 4. 本地开发

#### 本地模式（使用本地 Functions）

```bash
npm run dev
```

- ✅ 前端 Vite: `http://localhost:3000`
- ✅ 后端 Functions: `http://localhost:8788` (Miniflare)
- ❌ 无法访问外网

#### 远程模式（使用线上 API）

```bash
npm run dev:remote
```

- ✅ 前端 Vite: `http://localhost:3000`
- ✅ 后端: 使用线上已部署的 Functions
- ⚠️ 需要先部署一次: `npm run pages:deploy`

### 5. 构建和部署

```bash
# 构建
npm run build

# 部署到 Cloudflare Pages
npm run pages:deploy
```

## 📁 项目结构

```
├── functions/              # Cloudflare Functions
│   ├── _shared/            # 共享模块
│   │   ├── response.js     # 统一响应格式工具
│   │   └── storage.js      # KV 存储工具（需配置）
│   └── api/                # API 端点
│       └── health.js       # 示例健康检查端点
├── src/                    # Vue 前端
│   └── composables/        # Composables
│       └── usePWAUpdate.js # PWA 更新管理
├── public/                 # 静态资源
│   ├── sw.js              # Service Worker
│   ├── manifest.json      # PWA 清单
│   └── _headers           # Cloudflare Headers
├── scripts/                # 脚本
│   ├── update-sw-version.js # 版本号更新脚本
│   ├── setup-git-hooks.sh  # Git hooks 设置
│   └── pre-commit-hook.js  # Pre-commit hook
├── .github/                # GitHub Actions
│   └── workflows/
│       └── deploy.yml      # 自动部署工作流
├── wrangler.toml          # Cloudflare 配置
├── vite.config.js          # Vite 配置
└── dev.sh                  # 开发脚本
```

## 🔧 核心功能说明

### Cloudflare Functions

#### 创建 API 端点

在 `functions/api/` 目录下创建文件，例如 `functions/api/users.js`:

```javascript
import { createSuccessResponse, createErrorResponse } from '../_shared/response.js'

export async function onRequestGet(context) {
  const { env } = context
  // 你的逻辑
  return createSuccessResponse({ message: 'Hello' })
}
```

#### 使用 KV 存储

```javascript
import { getItems, setItems } from '../_shared/storage.js'

// 读取
const data = await getItems(env, 'my-key')

// 写入
await setItems(env, { foo: 'bar' }, 'my-key')
```

### PWA 功能

#### 使用 PWA 更新管理

在 `main.js` 或组件中:

```javascript
import { usePWAUpdate } from '@/composables/usePWAUpdate'

const { updateAvailable, checkForUpdate, applyUpdate } = usePWAUpdate()

// 检查更新
await checkForUpdate()

// 应用更新
if (updateAvailable.value) {
  await applyUpdate()
}
```

#### Service Worker 版本号

版本号格式: `PROJECT_NAME-YYYYMMDD-HHmm` (UTC+8 时区)

- 构建时自动更新（prebuild hook）
- Git commit 时自动更新（pre-commit hook）
- 手动更新: `npm run version`

### CI/CD 自动化

#### 配置 GitHub Actions

1. 在 GitHub 仓库设置 Secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

2. 编辑 `.github/workflows/deploy.yml`:
   - 修改 `projectName` 为你的项目名称
   - 修改构建命令（如果需要）

3. 推送代码到 `main` 或 `master` 分支即可自动部署

详细配置说明见 [.github/GITHUB_ACTIONS.md](.github/GITHUB_ACTIONS.md)

## 📝 常用命令

| 命令 | 说明 |
|------|------|
| `npm run init` | 交互式初始化项目配置 |
| `npm run dev` | 本地开发（本地 Functions） |
| `npm run dev:remote` | 远程开发（线上 API） |
| `npm run build` | 构建生产版本 |
| `npm run version` | 手动更新 Service Worker 版本号 |
| `npm run setup:hooks` | 设置 Git hooks（自动更新版本号） |
| `npm run pages:deploy` | 部署到 Cloudflare Pages |

## 🔍 API 端点示例

### 健康检查

```bash
GET /api/health
```

响应:
```json
{
  "success": true,
  "message": "服务器运行正常",
  "data": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "status": "healthy"
  }
}
```

## 🐛 常见问题

### 本地开发没有数据？

本地模式使用 Miniflare 模拟 KV，数据存储在内存中。重启后会清空。

### 部署后 KV 数据丢失？

检查 Cloudflare Dashboard 的 KV 绑定配置：
1. 访问 Cloudflare Dashboard
2. 选择 Pages 项目
3. Settings → Functions
4. 添加 KV namespace 绑定

### PWA 如何自动更新？

Service Worker 版本号会在构建时自动更新。首次使用需要运行 `npm run setup:hooks` 设置 Git hooks，之后每次提交都会自动更新版本号。

### 如何修改 Service Worker 缓存策略？

编辑 `public/sw.js`，根据需求修改 fetch 事件处理逻辑。

## 📚 更多资源

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Functions 文档](https://developers.cloudflare.com/pages/platform/functions/)
- [Cloudflare KV 文档](https://developers.cloudflare.com/kv/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Vite 文档](https://vitejs.dev/)

## 📄 License

MIT

---

Made with ❤️ by Cloudflare Pages + PWA Team

