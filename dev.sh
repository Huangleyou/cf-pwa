#!/bin/bash

# 前后端同时开发脚本
# 使用方法:
#   ./dev.sh           - 本地模式 (Miniflare)
#   ./dev.sh --remote  - 远程模式 (使用线上 Workers)

# TODO: 配置你的项目部署 URL（用于远程模式）
PROJECT_URL="https://your-project.pages.dev"

# 检查参数
REMOTE_MODE=false
[[ "$1" == "--remote" ]] && REMOTE_MODE=true

# 清理函数
cleanup() {
  # 防止重复执行
  if [ -n "$CLEANUP_DONE" ]; then
    return
  fi
  CLEANUP_DONE=1

  echo ""
  echo "🛑 停止所有服务..."
  pkill -P $$ 2>/dev/null
  pkill -f "wrangler pages dev" 2>/dev/null
  pkill -f "vite" 2>/dev/null
  lsof -ti:3000 | xargs kill -9 2>/dev/null
  lsof -ti:8788 | xargs kill -9 2>/dev/null
  echo "✅ 已停止"
}

trap cleanup INT TERM EXIT

# 清理已有进程
echo "🧹 清理旧进程..."
pkill -f "wrangler pages dev" 2>/dev/null
pkill -f "vite" 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8788 | xargs kill -9 2>/dev/null
sleep 1

# 启动后端
if [ "$REMOTE_MODE" = true ]; then
  echo "🌐 远程模式: 使用线上 API"
  echo "   ⚠️  请确保已部署: npm run pages:deploy"
  echo "   📍 项目 URL: $PROJECT_URL"
  echo ""
  FUNCTIONS_PID=0
else
  echo "💻 本地模式: 本地 Functions"
  echo ""
  echo "📦 构建前端..."
  npm run build
  echo ""
  echo "🔧 启动 Functions (8788)..."

  # TODO: 修改 KV 绑定名称（与 wrangler.toml 中的 binding 一致）
  # 例如: --kv APP_KV
  wrangler pages dev dist --kv APP_KV --port 8788 &
  FUNCTIONS_PID=$!

  echo "⏳ 等待启动 (编译 Worker + 启动服务器)..."

  # 等待端口开始监听,最多等 20 秒
  spinner="⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"
  for i in {1..20}; do
    # 显示进度条
    idx=$((i % 10))
    char=${spinner:$idx:1}

    sleep 1

    if lsof -ti:8788 > /dev/null 2>&1; then
      printf "\r✅ Functions 已启动          \n"
      break
    fi

    if [ $i -eq 20 ]; then
      printf "\r❌ Functions 启动超时\n"
      exit 1
    fi
  done
fi

# 启动前端
echo ""
echo "⚡ 启动 Vite (http://localhost:3000)..."
echo "   按 Ctrl+C 停止所有服务"
echo ""

if [ "$REMOTE_MODE" = true ]; then
  export VITE_REMOTE_MODE=true
  export VITE_REMOTE_URL="$PROJECT_URL"
fi

# 隐藏所有警告
NODE_NO_WARNINGS=1 npx vite --logLevel error

cleanup

