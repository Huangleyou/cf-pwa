<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    :class="iconClass"
  >
    <!-- 设置/齿轮 -->
    <template v-if="type === 'settings'">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </template>

    <!-- 锁 -->
    <template v-else-if="type === 'lock'">
      <rect x="5" y="11" width="14" height="10" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </template>

    <!-- 搜索 -->
    <template v-else-if="type === 'search'">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </template>

    <!-- 向上箭头（返回顶部） -->
    <template v-else-if="type === 'arrow-up'">
      <path d="M12 19V5"></path>
      <path d="M5 12l7-7 7 7"></path>
    </template>

    <!-- 向左箭头（返回） -->
    <template v-else-if="type === 'arrow-left'">
      <path d="M19 12H5"></path>
      <path d="M12 19l-7-7 7-7"></path>
    </template>

    <!-- 向右箭头 -->
    <template v-else-if="type === 'arrow-right'">
      <path d="M5 12h14"></path>
      <path d="M12 5l7 7-7 7"></path>
    </template>

    <!-- 关闭/X -->
    <template v-else-if="type === 'close'">
      <path d="M18 6L6 18"></path>
      <path d="M6 6l12 12"></path>
    </template>

    <!-- 显示密码（眼睛） -->
    <template v-else-if="type === 'eye'">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </template>

    <!-- 隐藏密码（眼睛带斜线） -->
    <template v-else-if="type === 'eye-off'">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </template>

    <!-- 等待/加载 -->
    <template v-else-if="type === 'loading'">
      <circle cx="12" cy="12" r="10" opacity="0.3"></circle>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
    </template>

    <!-- 包裹/版本 -->
    <template v-else-if="type === 'package'">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </template>

    <!-- 刷新/更新 -->
    <template v-else-if="type === 'refresh'">
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"></path>
    </template>

    <!-- 下载/加载数据 -->
    <template v-else-if="type === 'download'">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </template>

    <!-- 成功/完成 -->
    <template v-else-if="type === 'check'">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </template>

    <!-- 警告 -->
    <template v-else-if="type === 'warning'">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </template>

    <!-- 完成/闪烁 -->
    <template v-else-if="type === 'sparkle'">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
      <circle cx="12" cy="12" r="4"></circle>
    </template>

    <!-- 错误 -->
    <template v-else-if="type === 'error'">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </template>

    <!-- 信息 -->
    <template v-else-if="type === 'info'">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </template>
  </svg>
</template>

<script>
export default {
  name: 'Icon',
  props: {
    type: {
      type: String,
      required: true,
      validator: (value) => {
        return ['settings', 'lock', 'search', 'arrow-up', 'arrow-left', 'arrow-right', 'close', 'eye', 'eye-off', 'loading', 'package', 'refresh', 'download', 'check', 'warning', 'sparkle', 'error', 'info'].includes(value)
      }
    },
    size: {
      type: [Number, String],
      default: 24
    },
    iconClass: {
      type: String,
      default: ''
    }
  }
}
</script>

