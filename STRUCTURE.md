# 脚手架文件结构

## 完整文件清单

```
cf-pwa/
├── .github/
│   ├── GITHUB_ACTIONS.md          # CI/CD 配置文档
│   └── workflows/
│       └── deploy.yml              # GitHub Actions 工作流
├── functions/
│   ├── _shared/
│   │   ├── response.js             # 统一响应格式工具
│   │   └── storage.js              # KV 存储工具（需配置）
│   └── api/
│       └── health.js               # 示例健康检查端点
├── public/
│   ├── _headers                    # Cloudflare Headers 配置
│   ├── manifest.json               # PWA 清单（需配置）
│   └── sw.js                       # Service Worker（需配置）
├── scripts/
│   ├── pre-commit-hook.js          # Git pre-commit hook
│   ├── setup-git-hooks.sh         # Git hooks 设置脚本
│   └── update-sw-version.js        # Service Worker 版本号更新（需配置）
├── src/
│   ├── composables/
│   │   └── usePWAUpdate.js         # PWA 更新管理 Composable
│   └── main.js                     # 应用入口文件（示例）
├── .gitignore                      # Git 忽略配置
├── dev.sh                          # 开发脚本（需配置）
├── index.html                      # HTML 入口（需配置）
├── package.json                    # 项目配置（需配置）
├── postcss.config.js               # PostCSS 配置
├── README.md                       # 使用文档
├── STRUCTURE.md                    # 文件结构说明（本文件）
├── vite.config.js                  # Vite 配置
└── wrangler.toml                   # Cloudflare 配置（需配置）

```

## 配置检查清单

使用脚手架前，需要配置以下文件：

### 必需配置

- [ ] `package.json` - 修改项目名称
- [ ] `wrangler.toml` - 修改项目名称和 KV Namespace ID
- [ ] `public/sw.js` - 修改 PROJECT_NAME
- [ ] `scripts/update-sw-version.js` - 修改 PROJECT_NAME
- [ ] `public/manifest.json` - 修改应用信息
- [ ] `dev.sh` - 修改 PROJECT_URL 和 KV 绑定名称
- [ ] `.github/workflows/deploy.yml` - 修改 projectName

### 可选配置

- [ ] `functions/_shared/storage.js` - 修改 KV_BINDING（如果与默认不同）
- [ ] `index.html` - 修改应用标题和描述
- [ ] `vite.config.js` - 根据需求调整配置

## 功能模块

### ✅ Cloudflare Functions
- Functions 结构模板
- 共享工具模块（响应、存储）
- 示例 API 端点
- 配置文件（wrangler.toml, _headers）
- 本地开发脚本

### ✅ PWA 机制
- Service Worker（带版本管理）
- Manifest 配置
- 版本号自动更新脚本
- Git hooks 自动更新
- PWA 更新管理 Composable

### ✅ CI/CD 自动化
- GitHub Actions 工作流
- 配置文档
- 自动部署流程

