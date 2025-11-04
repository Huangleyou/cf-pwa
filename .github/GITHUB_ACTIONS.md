# GitHub Actions 自动部署

本项目包含 GitHub Actions 工作流，可以在推送代码时自动部署到 Cloudflare Pages。

## 设置步骤

### 1. 获取 Cloudflare API Token

1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 点击 "Create Token"
3. 选择 "Edit Cloudflare Workers" 模板
4. 或创建自定义 Token，需要以下权限:
   - Account > Cloudflare Pages > Edit
   - Account > Account Settings > Read

### 2. 获取 Account ID

1. 访问 https://dash.cloudflare.com
2. 选择任意域名
3. 在右侧栏找到 "Account ID"
4. 复制该 ID

### 3. 配置 GitHub Secrets

在 GitHub 仓库中:

1. Settings → Secrets and variables → Actions
2. 添加以下 Secrets:

| Secret 名称 | 值 |
|------------|-----|
| `CLOUDFLARE_API_TOKEN` | 步骤 1 中创建的 API Token |
| `CLOUDFLARE_ACCOUNT_ID` | 步骤 2 中的 Account ID |

### 4. 配置工作流文件

编辑 `.github/workflows/deploy.yml`:

- 修改 `projectName` 为你的 Cloudflare Pages 项目名称
- 修改 `build` 命令（如果需要）
- 修改触发分支（如果需要）

### 5. 推送代码

```bash
git add .
git commit -m "Setup Cloudflare deployment"
git push
```

GitHub Actions 会自动:
1. 检出代码
2. 安装依赖
3. 构建项目
4. 部署到 Cloudflare Pages

## 查看部署状态

1. 在 GitHub 仓库的 "Actions" 标签查看工作流运行状态
2. 在 Cloudflare Dashboard → Pages 查看部署历史

## 手动触发部署

在 GitHub Actions 页面:
1. 选择 "Deploy to Cloudflare Pages" 工作流
2. 点击 "Run workflow"
3. 选择分支
4. 点击 "Run workflow"

## 自定义工作流

编辑 `.github/workflows/deploy.yml`:

- 修改触发分支
- 添加测试步骤
- 配置构建参数
- 设置部署环境

## 禁用自动部署

如果只想手动部署:

1. 删除 `.github/workflows/deploy.yml`
2. 或修改 `on:` 部分，只保留 `workflow_dispatch`

## 环境变量

如需在构建时使用环境变量:

1. 在 GitHub Secrets 中添加变量
2. 在 `deploy.yml` 中添加:

```yaml
- name: Build
  run: npm run build
  env:
    MY_VAR: ${{ secrets.MY_VAR }}
```

## 故障排查

### 部署失败

1. 检查 API Token 权限
2. 确认 Account ID 正确
3. 查看 Actions 日志
4. 确认项目名称 `projectName` 与 Cloudflare 中一致

### KV 绑定问题

KV 绑定需要在 Cloudflare Dashboard 手动配置，GitHub Actions 只部署代码和静态文件。

首次部署后:
1. 访问 Cloudflare Dashboard
2. 选择 Pages 项目
3. Settings → Functions
4. 添加 KV namespace 绑定

## 更多资源

- [Cloudflare Pages GitHub Action](https://github.com/cloudflare/pages-action)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)

