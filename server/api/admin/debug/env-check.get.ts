/**
 * 環境變數檢查端點（僅供除錯使用）
 * GET /api/admin/debug/env-check
 *
 * 注意：此端點不需要認證，僅用於除錯
 */

export default defineEventHandler(async (event) => {
  // 跳過認證檢查
  event.context.skipAuth = true

  const config = useRuntimeConfig()

  return {
    success: true,
    timestamp: new Date().toISOString(),
    config: {
      jwtSecretConfigured: !!config.jwtSecret,
      jwtSecretLength: config.jwtSecret?.length || 0,
      jwtSecretPreview: config.jwtSecret ? config.jwtSecret.substring(0, 10) + '...' : 'NOT SET',
      cookieSecure: config.cookieSecure,
      mongodbUriConfigured: !!config.mongodbUri,
      mongodbUriPreview: config.mongodbUri ? config.mongodbUri.substring(0, 20) + '...' : 'NOT SET'
    },
    env: {
      JWT_SECRET: process.env.JWT_SECRET ? `已設定 (${process.env.JWT_SECRET.length} 字元)` : '未設定',
      COOKIE_SECURE: process.env.COOKIE_SECURE || '未設定',
      MONGODB_URI: process.env.MONGODB_URI ? '已設定' : '未設定',
      NODE_ENV: process.env.NODE_ENV || '未設定'
    }
  }
})
