// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Nuxt Modules
  modules: ['@nuxt/ui'],

  // 添加這個 Nitro 配置
  nitro: {
    preset: 'node-server'
  },
  // Runtime 配置 - 環境變數
  runtimeConfig: {
    // Server-side 環境變數（不會暴露給客戶端）
    mongodbUri: process.env.MONGO_URI || '',
    mongodbUsername: process.env.MONGO_USERNAME || '',
    mongodbPassword: process.env.MONGO_PASSWORD || '',
    mongodbHost: process.env.MONGO_HOST || '',
    mongodbPort: process.env.MONGO_PORT || '27017',
    mongodbDatabase: process.env.MONGO_DATABASE || '',
    jwtSecret: process.env.JWT_SECRET || '',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    // MinIO 物件儲存設定
    minioEndpoint: process.env.MINIO_ENDPOINT || '',
    minioAccessKey: process.env.MINIO_ACCESS_KEY || '',
    minioSecretKey: process.env.MINIO_SECRET_KEY || '',
    minioBucketName: process.env.MINIO_BUCKET_NAME || '',
    minioUseSSL: process.env.MINIO_USE_SSL === 'true'
  },
  devtools: { enabled: true },

  // SSR 設定
  ssr: true,

  // App 配置
  // 注意：這裡的值是 fallback，真正的 SEO 值會在 app.vue 從 site_settings 動態載入
  app: {
    head: {
      title: '個人作品集',
      htmlAttrs: {
        lang: 'zh-TW'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '歡迎來到我的個人作品集網站' },
        { property: 'og:type', content: 'website' },
        { name: 'theme-color', content: '#fafaf9' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        // Google Fonts - 預連接
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        // Google Fonts - 實際載入 Instrument Serif 字體（這是 FOUC 問題的關鍵修復）
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap' }
      ],
      style: [
        {
          // 最小化的 Critical CSS - 只處理背景色和基本佈局，防止白閃
          innerHTML: `html,body{background:#fafaf9;margin:0;min-height:100vh}`
        }
      ]
    }
  },

  // 路由配置
  router: {
    options: {
      scrollBehaviorType: 'smooth'
    }
  },

  // 效能優化
  experimental: {
    payloadExtraction: true,
    renderJsonPayloads: true,
    // 啟用 SSR 樣式內嵌，防止 FOUC
    inlineSSRStyles: true
  },

  // CSS 配置
  css: ['~/app.css'],

  // 路由規則 - Admin 全部使用 CSR
  routeRules: {
    '/admin/**': { ssr: false }
  },
})
