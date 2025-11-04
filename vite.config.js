import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        silenceDeprecations: ['import', 'legacy-js-api']
      }
    }
  },
  server: {
    port: 3000,
    open: 'http://localhost:3000',
    proxy: {
      '/api': {
        // 根据环境变量决定代理目标
        // VITE_REMOTE_MODE=true 时使用线上 API,否则使用本地
        target: process.env.VITE_REMOTE_MODE && process.env.VITE_REMOTE_URL
          ? process.env.VITE_REMOTE_URL
          : 'http://localhost:8788',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router']
        }
      }
    }
  },
  // PWA 支持: 将 Service Worker 和 manifest 复制到 dist
  publicDir: 'public'
})

