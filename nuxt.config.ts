// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  // 添加這個 Nitro 配置  
  nitro: {  
    preset: 'node-server'
  },  
  // Runtime 配置 - 環境變數
  runtimeConfig: {
    // Server-side 環境變數（不會暴露給客戶端）
    mongodbUri: process.env.MONGODB_URI || '',
    mongodbUsername: process.env.MONGODB_USERNAME || '',
    mongodbPassword: process.env.MONGODB_PASSWORD || '',
    mongodbHost: process.env.MONGODB_HOST || '',
    mongodbPort: process.env.MONGODB_PORT || '27017',
    mongodbDatabase: process.env.MONGODB_DATABASE || ''
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
    renderJsonPayloads: true
  },
})
