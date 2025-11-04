// 版本号会在构建时自动更新 (scripts/update-sw-version.js)
// 格式: PROJECT_NAME-YYYYMMDD-HHmm (基于 UTC+8 时区，中国标准时间)
// TODO: 修改下面的 PROJECT_NAME 为你的项目名称
const PROJECT_NAME = 'your-project'
const CACHE_NAME = `${PROJECT_NAME}-20250101-0000`
const RUNTIME_CACHE = `${PROJECT_NAME}-runtime-20250101-0000`

// 需要预缓存的资源
// TODO: 根据你的项目调整预缓存资源列表
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js'
]

// 安装事件 - 预缓存静态资源
self.addEventListener('install', event => {
  console.log('[SW] Install')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching app shell')
        return cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'reload' })))
      })
      .catch(err => {
        console.log('[SW] Precache failed:', err)
      })
  )
  // 立即激活新的 Service Worker
  self.skipWaiting()
})

// 监听 skipWaiting 消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  console.log('[SW] Activate')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE)
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  self.clients.claim()
})

// Fetch 事件 - 网络优先,失败时使用缓存
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return
  }

  // 跳过跨域请求 (除了图片)
  if (url.origin !== location.origin && !request.destination.match(/image/i)) {
    return
  }

  // API 请求: 网络优先,失败时提示
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(
            JSON.stringify({
              success: false,
              message: '网络不可用,请检查连接'
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        })
    )
    return
  }

  // 图片请求: 缓存优先,失败时网络获取
  if (request.destination === 'image') {
    // 验证图片响应是否完整
    const validateImageResponse = async (response) => {
      if (!response || response.status !== 200 || !response.ok) {
        return false
      }

      // 检查是否有 Content-Length 头部
      const contentLength = response.headers.get('Content-Length')
      if (contentLength) {
        try {
          // 读取响应体并验证大小
          const clonedResponse = response.clone()
          const arrayBuffer = await clonedResponse.arrayBuffer()
          const actualLength = arrayBuffer.byteLength
          const expectedLength = parseInt(contentLength, 10)

          // 如果实际大小与预期大小不一致，说明图片不完整
          if (actualLength !== expectedLength) {
            return false
          }

          // 验证响应体不为空
          if (actualLength === 0) {
            return false
          }
        } catch (error) {
          // 读取响应体失败，不缓存
          return false
        }
      } else {
        // 如果没有 Content-Length，尝试验证响应体不为空
        try {
          const clonedResponse = response.clone()
          const arrayBuffer = await clonedResponse.arrayBuffer()
          if (arrayBuffer.byteLength === 0) {
            return false
          }
        } catch (error) {
          // 读取响应体失败，不缓存
          return false
        }
      }

      return true
    }

    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) {
            return cached
          }
          return fetch(request)
            .then(async response => {
              // 验证响应是否完整
              const isValid = await validateImageResponse(response)

              // 只缓存完整且成功的响应
              if (isValid) {
                const responseToCache = response.clone()
                caches.open(RUNTIME_CACHE).then(cache => {
                  cache.put(request, responseToCache)
                }).catch(() => {
                  // 缓存写入失败时不处理，不缓存失败的内容
                })
              }
              // 对于不完整或失败的响应，直接返回，不缓存
              return response
            })
            .catch(() => {
              // 图片加载失败,返回占位图，但不缓存占位图
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#ddd" width="200" height="200"/></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              )
            })
        })
        .catch(() => {
          // 缓存查询失败时，尝试网络请求
          return fetch(request)
            .then(async response => {
              // 验证响应是否完整
              const isValid = await validateImageResponse(response)

              // 只缓存完整且成功的响应
              if (isValid) {
                const responseToCache = response.clone()
                caches.open(RUNTIME_CACHE).then(cache => {
                  cache.put(request, responseToCache)
                }).catch(() => {
                  // 缓存写入失败时不处理
                })
              }
              return response
            })
            .catch(() => {
              // 网络请求也失败，返回占位图，但不缓存
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#ddd" width="200" height="200"/></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              )
            })
        })
    )
    return
  }

  // HTML 请求: 缓存优先,后台更新（减少白屏时间）
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          // 如果缓存存在，立即返回
          if (cached) {
            // 后台检查更新（不阻塞响应）
            fetch(request)
              .then(response => {
                if (response && response.status === 200) {
                  const responseToCache = response.clone()
                  caches.open(RUNTIME_CACHE).then(cache => {
                    cache.put(request, responseToCache)
                  })
                }
              })
              .catch(() => {
                // 后台更新失败不影响当前响应
              })
            return cached
          }
          // 缓存不存在，从网络获取
          return fetch(request)
            .then(response => {
              if (response && response.status === 200) {
                const responseToCache = response.clone()
                caches.open(RUNTIME_CACHE).then(cache => {
                  cache.put(request, responseToCache)
                })
              }
              return response
            })
            .catch(() => {
              // 网络失败，尝试匹配首页
              return caches.match('/') || caches.match('/index.html')
            })
        })
    )
    return
  }

  // 其他请求: 网络优先,失败时使用缓存
  event.respondWith(
    fetch(request)
      .then(response => {
        // 缓存成功的响应
        if (response && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        return caches.match(request).then(cached => {
          if (cached) {
            return cached
          }
        })
      })
  )
})

