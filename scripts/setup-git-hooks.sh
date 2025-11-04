#!/bin/bash

# 安装 Git hooks 脚本
# 用于自动更新 Service Worker 版本号

echo "🔧 设置 Git hooks..."

# 确保 hooks 目录存在
mkdir -p .git/hooks

# 创建 pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# 自动更新 Service Worker 版本号
node scripts/pre-commit-hook.js
EOF

# 设置执行权限
chmod +x .git/hooks/pre-commit
chmod +x scripts/pre-commit-hook.js
chmod +x scripts/update-sw-version.js

echo "✅ Git hooks 设置完成！"
echo ""
echo "现在每次 git commit 时都会自动："
echo "  1. 更新 Service Worker 版本号（基于 UTC+8 时区，中国标准时间）"
echo "  2. 将更新后的文件添加到提交"
echo ""
echo "版本号格式: PROJECT_NAME-YYYYMMDD-HHmm"
echo "例如: your-project-20251031-1730 (2025年10月31日 17:30，UTC+8 时区)"

