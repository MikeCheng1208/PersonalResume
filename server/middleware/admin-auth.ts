/**
 * Admin 認證中介軟體
 * 保護所有 /api/admin/* 路由（除了 /api/admin/auth/* 登入相關）
 */

export default defineEventHandler(async (event) => {
  const path = event.path

  // 只處理 /api/admin 路由
  if (!path.startsWith('/api/admin')) {
    return
  }

  // 允許登入相關 API 和除錯端點不需驗證
  const publicPaths = [
    '/api/admin/auth/login',
    '/api/admin/auth/logout',
    '/api/admin/debug/' // 除錯端點
  ]

  if (publicPaths.some(p => path.startsWith(p))) {
    return
  }

  // 驗證 JWT Token
  const user = getCurrentUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '未登入或登入已過期，請重新登入'
    })
  }

  // 將使用者資訊附加到 event context，方便後續使用
  event.context.adminUser = user
})
