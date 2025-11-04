/**
 * 应用入口文件
 *
 * 使用说明:
 * 1. 根据你的项目需求配置路由和状态管理
 * 2. 集成 PWA 更新管理（可选）
 */

import { createApp } from 'vue'
// import router from './router'
// import App from './App.vue'
// import './styles/main.scss'

// 示例: 创建基础 Vue 应用
const app = createApp({
  template: '<div>Hello from Cloudflare Pages + PWA!</div>'
})

// 如果使用路由
// app.use(router)

// PWA 更新管理（可选）
// import { usePWAUpdate } from '@/composables/usePWAUpdate'
// const { checkForUpdate } = usePWAUpdate()

app.mount('#app')

