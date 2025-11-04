/**
 * 应用入口文件
 *
 * 使用说明:
 * 1. 根据你的项目需求配置路由和状态管理
 * 2. 集成 PWA 更新管理（可选）
 */

import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.scss'

// 如果使用路由
// import router from './router'

// 创建 Vue 应用
const app = createApp(App)

// 如果使用路由
// app.use(router)

app.mount('#app')

