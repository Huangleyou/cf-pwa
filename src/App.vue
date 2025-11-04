<template>
  <div id="app">
    <!-- Splash 启动页 -->
    <Splash v-if="showSplash" :on-complete="handleSplashComplete" />

    <!-- 主应用内容 -->
    <div v-if="!showSplash">
      <!-- TODO: 根据你的项目需求添加路由或其他内容 -->
      <div class="main-content">
        <h1>欢迎使用 CF PWA</h1>
        <p>应用已成功加载</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import Splash from '@/components/Splash.vue'
import { usePWAUpdate } from '@/composables/usePWAUpdate'

export default {
  name: 'App',
  components: {
    Splash
  },
  setup() {
    const showSplash = ref(true)

    // PWA 更新管理（在应用运行期间也可用）
    const pwaUpdate = usePWAUpdate()

    const handleSplashComplete = () => {
      showSplash.value = false
      // Splash 中已经处理了所有初始化工作，包括 Service Worker 注册
      // PWA 更新管理已初始化，可在应用运行期间使用
    }

    onMounted(() => {
      // PWA 更新管理在 usePWAUpdate 中已经自动初始化
      // 这里可以添加额外的更新检查逻辑（可选）
      // 例如：定期检查更新、监听更新事件等
    })

    return {
      showSplash,
      handleSplashComplete,
      // 导出 PWA 更新管理，供其他组件使用（可选）
      pwaUpdate
    }
  }
}
</script>

<style lang="scss">
@import '@/styles/main.scss';

// 全局 html 和 body 样式，确保滚动回弹时也是深色背景
html {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%) !important;
  background-attachment: fixed;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}

// 全局 body 样式，确保底部安全区域也有背景
body {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%) !important;
  background-attachment: fixed;
  min-height: 100vh;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}

#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  position: relative;
  // viewport-fit=cover 已允许内容延伸到安全区域
  // 具体元素（如固定定位的按钮）需要单独处理安全区域
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;

  // 添加背景图案（所有页面共享）
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 0;
    background:
      radial-gradient(circle at 20% 30%, rgba(102, 126, 234, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(118, 75, 162, 0.06) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(102, 126, 234, 0.04) 0%, transparent 50%);
    pointer-events: none;
  }

  .main-content {
    position: relative;
    z-index: 1;
    padding: 40px 20px;
    @include safe-area-top-padding(40px);
    @include safe-area-bottom-padding(40px);
    color: white;
    text-align: center;

    h1 {
      font-size: 2rem;
      margin-bottom: 16px;
    }

    p {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}
</style>

