<template>
  <transition name="splash-fade">
    <div v-if="visible" class="splash-screen" @click="handleClick">
      <div class="splash-content">
        <!-- Logo/标题 -->
        <div class="splash-logo">
          <div class="logo-title">
            <span class="title-main">CF PWA</span>
          </div>
        </div>

        <!-- 进度信息 -->
        <div class="splash-info">
          <!-- 进度条 -->
          <div v-if="!isReady" class="progress-container">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${progress}%` }"
              ></div>
            </div>
            <div class="progress-text">{{ progressText }}</div>
          </div>

          <!-- 状态信息 -->
          <div class="status-info">
            <div v-if="currentStatus && !isReady" class="status-item">
              <Icon :type="statusIconType" :size="18" class="status-icon" />
              <span class="status-text">{{ currentStatus }}</span>
            </div>
            <!-- 点击提示（加载完成后显示） -->
            <transition name="click-hint-fade">
              <div v-if="isReady" class="click-hint">
                <span class="click-hint-text">点击任意处进入</span>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- 版本信息 - 固定在底部 -->
      <div class="version-info">
        <div class="version-item">
          <span class="version-label">版本:</span>
          <span class="version-value">{{ currentVersion }}</span>
        </div>
        <div v-if="updateAvailable" class="update-notice">
          <Icon type="refresh" :size="16" class="update-icon" />
          <span class="update-text">发现新版本</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { usePWAUpdate } from '@/composables/usePWAUpdate'
import Icon from '@/components/icons/Icon.vue'

export default {
  name: 'Splash',
  components: {
    Icon
  },
  props: {
    onComplete: {
      type: Function,
      required: true
    }
  },
  setup(props) {
    const visible = ref(true)
    const progress = ref(0)
    const currentStatus = ref('正在初始化...')
    const statusIconType = ref('loading')
    const updateAvailable = ref(false)
    const currentVersion = ref('')
    const isReady = ref(false)

    // 获取当前版本号（从 Service Worker）
    const getCurrentVersion = async () => {
      try {
        // 先从缓存中获取版本号
        const cacheKeys = await caches.keys()
        const cacheKey = cacheKeys.find(key => key.includes('your-project-'))
        if (cacheKey) {
          // 提取版本号
          const match = cacheKey.match(/your-project-(\d{8}-\d{4})/)
          if (match) {
            currentVersion.value = match[1]
            return
          }
        }

        // 如果缓存中没有，尝试从 Service Worker 文件获取
        const response = await fetch('/sw.js?t=' + Date.now())
        const text = await response.text()
        const match = text.match(/const CACHE_NAME\s*=\s*['"](your-project-[\w-]+)['"]/)
        if (match) {
          const versionMatch = match[1].match(/your-project-(\d{8}-\d{4})/)
          if (versionMatch) {
            currentVersion.value = versionMatch[1]
            return
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('获取版本号失败:', error)
        }
      }

      // 如果都失败，使用默认值
      if (!currentVersion.value) {
        currentVersion.value = '加载中...'
      }
    }

    // 更新进度
    const updateProgress = (value, status, iconType = 'loading') => {
      progress.value = Math.min(100, Math.max(0, value))
      currentStatus.value = status
      statusIconType.value = iconType
    }

    // 初始化流程
    const initialize = async () => {
      try {
        // 步骤 1: 获取版本号 (10%)
        updateProgress(10, '正在获取版本信息...', 'package')
        await getCurrentVersion()

        // 步骤 2: 检查 PWA 更新 (30%)
        updateProgress(30, '正在检查更新...', 'refresh')
        const pwaUpdate = usePWAUpdate()
        // 等待 Service Worker 注册完成
        await new Promise(resolve => setTimeout(resolve, 1500))

        // 手动检查更新（在 splash 页面触发）
        if (pwaUpdate.registration && pwaUpdate.registration.value) {
          try {
            const hasUpdate = await pwaUpdate.checkForUpdate()
            if (hasUpdate) {
              updateAvailable.value = true
            }
          } catch (error) {
            // 检查更新失败不影响启动
            if (import.meta.env.DEV) {
              console.warn('检查更新失败:', error)
            }
          }
        }

        // 步骤 3: 初始化完成 (100%)
        updateProgress(100, '加载完成', 'sparkle')
        await new Promise(resolve => setTimeout(resolve, 500))

        // 标记为准备完成，显示点击提示
        isReady.value = true
        currentStatus.value = ''

      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('初始化失败:', error)
        }
        updateProgress(100, '初始化完成', 'check')
        await new Promise(resolve => setTimeout(resolve, 500))
        // 即使出错也标记为准备完成
        isReady.value = true
        currentStatus.value = ''
      }
    }

    const progressText = computed(() => {
      return `${Math.round(progress.value)}%`
    })

    // 处理点击事件
    const handleClick = () => {
      // 只有加载完成后才响应点击
      if (isReady.value) {
        visible.value = false
        setTimeout(() => {
          props.onComplete()
        }, 300)
      }
    }

    onMounted(() => {
      initialize()
    })

    return {
      visible,
      progress,
      currentStatus,
      statusIconType,
      updateAvailable,
      currentVersion,
      progressText,
      isReady,
      handleClick
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/main.scss';

.splash-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 20px;
  cursor: pointer;
}

.splash-content {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.splash-logo {
  .logo-title {
    font-size: 3rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;

    .title-main {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 32px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      line-height: 1;
    }

    @include mobile {
      font-size: 2.5rem;

      .title-main {
        padding: 12px 24px;
      }
    }
  }
}

.splash-info {
  width: 100%;
  height: 140px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.progress-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;

  .progress-fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
  }
}

.progress-text {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
}

.status-info {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;

  .status-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: currentColor;
    animation: rotate 2s linear infinite;
  }

  .status-text {
    font-weight: 500;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.click-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;

  .click-hint-text {
    color: #667eea;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 2px;
    animation: blink 1.5s ease-in-out infinite;
    text-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
    user-select: none;
    cursor: pointer;

    @include mobile {
      font-size: 16px;
      letter-spacing: 1px;
    }
  }
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.98);
  }
}

// 点击提示淡入动画
.click-hint-fade-enter-active {
  transition: opacity 0.5s ease;
}

.click-hint-fade-enter-from {
  opacity: 0;
}

.version-info {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  @include safe-area-bottom-padding(16px);
  z-index: 100000;
  pointer-events: none;
}

.version-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;

  .version-label {
    font-weight: 500;
  }

  .version-value {
    font-family: 'Monaco', 'Menlo', monospace;
    background: rgba(255, 255, 255, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
  }
}

.update-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #667eea;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.3);

  .update-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: currentColor;
    animation: rotate 2s linear infinite;
  }

  .update-text {
    font-weight: 600;
  }
}

// Splash 淡出动画
.splash-fade-enter-active,
.splash-fade-leave-active {
  transition: opacity 0.3s ease;
}

.splash-fade-enter-from,
.splash-fade-leave-to {
  opacity: 0;
}
</style>

