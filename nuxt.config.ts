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
    cookieSecure: process.env.COOKIE_SECURE === 'true'
  },
  devtools: { enabled: true },

  // SSR 設定
  ssr: true,

  // App 配置
  app: {
    head: {
      title: '李松年 - UI/UX 設計師',
      htmlAttrs: {
        lang: 'zh-TW'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '李松年的作品集 - 專注於使用者體驗設計與介面創新，透過設計解決問題，創造價值' },
        { name: 'author', content: '李松年' },
        { property: 'og:title', content: '李松年 - UI/UX 設計師' },
        { property: 'og:description', content: '專注於使用者體驗設計與介面創新，透過設計解決問題，創造價值' },
        { property: 'og:type', content: 'website' },
        { name: 'theme-color', content: '#fafaf9' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' }
      ],
      style: [
        {
          children: `
            /* Critical CSS - 防止 FOUC */
            html {
              background: #fafaf9;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            body {
              margin: 0;
              padding: 0;
              background: #fafaf9;
              color: #1a1a1a;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            /* 預設隱藏內容，避免 FOUC */
            #__nuxt {
              opacity: 0;
              transition: opacity 0.3s ease;
            }
            /* Vue 載入完成後顯示 */
            #__nuxt.nuxt-loaded {
              opacity: 1;
            }
          `,
          type: 'text/css'
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
    inlineSSRStyles: false
  },

  // CSS 配置
  css: ['~/app.css'],

  // 路由規則 - Admin 全部使用 CSR
  routeRules: {
    '/admin/**': { ssr: false }
  },
})
