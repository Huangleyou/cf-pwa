/**
 * PWA 更新管理 Composable
 * 提供 Service Worker 更新检测和管理功能
 *
 * 使用说明:
 * 1. 在 main.js 或 App.vue 中导入并使用
 * 2. 可选: 集成 toast 通知系统（见注释）
 */

import { ref } from 'vue'

/**
 * 简单的日志函数（可选替换为 toast）
 * 如果项目中有 toast 系统，可以替换此函数
 */
const logMessage = (message, type = 'info') => {
  if (import.meta.env.DEV) {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
    console.log(`${prefix} ${message}`)
  }
  // TODO: 如果项目中有 toast 系统，可以在这里调用
  // 例如: showToast(message, type)
}

export function usePWAUpdate() {
  const registration = ref(null)
  const updateAvailable = ref(false)
  const isUpdating = ref(false)

  // 注册 Service Worker
  const registerSW = async () => {
    if (!('serviceWorker' in navigator)) {
      return null
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      registration.value = reg

      if (import.meta.env.DEV) {
        console.log('✅ Service Worker 已注册:', reg.scope)
      }

      // 监听更新
      setupUpdateListener(reg)

      return reg
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Service Worker 注册失败:', error)
      }
      return null
    }
  }

  // 设置更新监听器
  const setupUpdateListener = (reg) => {
    // 检查是否有等待中的 Service Worker（说明有新版本但还没激活）
    // 只更新状态，不自动提示
    if (reg.waiting) {
      updateAvailable.value = true
    }

    // 监听更新发现（当浏览器检测到新的 Service Worker 时）
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing || reg.waiting

      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          // 如果已经有一个 Service Worker 在运行，说明有新版本
          // 只更新状态，不自动提示
          if (navigator.serviceWorker.controller) {
            updateAvailable.value = true
          }
        }
      })
    })

    // 监听 Service Worker 控制权变化
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Service Worker 已更新，刷新页面
      window.location.reload()
    })
  }

  // 检查更新
  const checkForUpdate = async () => {
    if (!registration.value) return

    try {
      await registration.value.update()
      if (import.meta.env.DEV) {
        console.log('🔄 已检查更新')
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('检查更新失败:', error)
      }
    }
  }

  // 应用更新
  const applyUpdate = async () => {
    if (!registration.value || isUpdating.value) return

    isUpdating.value = true
    logMessage('正在更新...', 'info')

    try {
      // 如果有等待中的 Service Worker，跳过等待并激活
      if (registration.value.waiting) {
        registration.value.waiting.postMessage({ type: 'SKIP_WAITING' })
        // 等待 Service Worker 控制权变化
        return
      }

      // 否则强制刷新
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('应用更新失败:', error)
      }
      logMessage('更新失败，请刷新页面重试', 'error')
      isUpdating.value = false
    }
  }

  // 手动检查更新
  const manualCheckUpdate = async () => {
    await checkForUpdate()

    // 延迟一下显示结果（延迟检查状态，因为更新检测可能需要时间）
    return new Promise((resolve) => {
      setTimeout(() => {
        // 再次检查是否有等待中的更新
        if (registration.value?.waiting) {
          updateAvailable.value = true
        }
        resolve(updateAvailable.value)
      }, 1000)
    })
  }

  // 清除缓存
  const clearCache = async (cacheNamePattern = null) => {
    if (!('caches' in window)) {
      logMessage('浏览器不支持缓存管理', 'error')
      return false
    }

    try {
      const cacheNames = await caches.keys()

      // 查找要清除的缓存
      // 如果提供了模式，只清除匹配的缓存；否则清除所有运行时缓存
      const cachesToClear = cacheNamePattern
        ? cacheNames.filter(name => name.includes(cacheNamePattern))
        : cacheNames.filter(name => name.includes('runtime'))

      if (cachesToClear.length === 0) {
        logMessage('没有找到缓存', 'info')
        return false
      }

      // 删除所有匹配的缓存
      let deletedCount = 0
      for (const cacheName of cachesToClear) {
        const deleted = await caches.delete(cacheName)
        if (deleted) {
          deletedCount++
        }
      }

      if (deletedCount > 0) {
        logMessage(`已清除 ${deletedCount} 个缓存`, 'success')
        return true
      } else {
        logMessage('没有找到缓存', 'info')
        return false
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('清除缓存失败:', error)
      }
      logMessage('清除缓存失败', 'error')
      return false
    }
  }

  // 立即注册 Service Worker（不依赖 onMounted）
  // 这样在 App.vue 中调用时就能立即注册
  if ('serviceWorker' in navigator) {
    // 页面加载时注册
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      registerSW()
    } else {
      window.addEventListener('load', () => {
        registerSW()
      })
      // 也尝试立即注册（如果 DOM 已经准备好）
      if (document.readyState !== 'loading') {
        registerSW()
      }
    }
  }

  return {
    registration,
    updateAvailable,
    isUpdating,
    checkForUpdate: manualCheckUpdate,
    applyUpdate,
    clearCache
  }
}

