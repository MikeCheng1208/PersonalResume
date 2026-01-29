/**
 * Admin 登入 API
 * POST /api/admin/auth/login
 *
 * 安全措施：
 * - NoSQL Injection 防護
 * - IP-based Rate Limiting
 * - 帳號鎖定機制
 * - 輸入驗證與清理
 */

import type { AdminUserDocument } from '~/types/database'
import { COLLECTIONS } from '~/types/database'

export default defineEventHandler(async (event) => {
  const clientIP = getClientIP(event)

  try {
    console.log('🔐 開始處理登入請求')
    console.log(`📍 客戶端 IP: ${clientIP}`)

    // 檢查 IP-based Rate Limit
    const rateLimit = checkRateLimit(clientIP, LOGIN_RATE_LIMIT)
    if (!rateLimit.allowed) {
      const waitMinutes = Math.ceil(rateLimit.resetIn / 60000)
      console.warn(`🚫 IP ${clientIP} 已達到登入嘗試限制`)
      throw createError({
        statusCode: 429,
        message: `登入嘗試次數過多，請在 ${waitMinutes} 分鐘後再試`
      })
    }

    // 讀取並驗證請求資料（包含 NoSQL Injection 防護）
    const rawBody = await readBody(event)
    const sanitized = sanitizeLoginInput(rawBody)

    if (!sanitized.valid) {
      throw createError({
        statusCode: 400,
        message: sanitized.error || '無效的請求'
      })
    }

    const { username, password } = sanitized

    console.log(`📝 嘗試登入帳號: ${username}`)

    // 查詢使用者（使用已清理的 username）
    const collection = await getCollection<AdminUserDocument>(COLLECTIONS.ADMIN_USERS)
    const user = await collection.findOne({
      username: username
    })

    console.log(`👤 找到使用者: ${user ? '是' : '否'}`)

    if (!user) {
      throw createError({
        statusCode: 401,
        message: '帳號或密碼錯誤'
      })
    }

    // 檢查帳號是否啟用
    if (!user.isActive) {
      throw createError({
        statusCode: 403,
        message: '此帳號已被停用'
      })
    }

    // 檢查帳號是否被鎖定
    if (isAccountLocked(user)) {
      const lockedMinutes = Math.ceil(
        (user.lockedUntil!.getTime() - Date.now()) / 60000
      )
      throw createError({
        statusCode: 403,
        message: `帳號已被鎖定，請在 ${lockedMinutes} 分鐘後再試`
      })
    }

    // 驗證密碼（使用已清理的 password）
    const isPasswordValid = await verifyPassword(password!, user.passwordHash)

    if (!isPasswordValid) {
      // 處理登入失敗
      const failureUpdate = handleLoginFailure(user)

      await collection.updateOne(
        { _id: user._id },
        {
          $set: {
            ...failureUpdate,
            updatedAt: new Date()
          }
        }
      )

      // 如果帳號被鎖定，返回特殊訊息
      if (failureUpdate.lockedUntil) {
        throw createError({
          statusCode: 403,
          message: '登入失敗次數過多，帳號已被鎖定 15 分鐘'
        })
      }

      throw createError({
        statusCode: 401,
        message: '帳號或密碼錯誤'
      })
    }

    // 登入成功，重置失敗次數和 Rate Limit
    const successUpdate = resetLoginAttempts()
    resetRateLimit(clientIP, 'login:')

    await collection.updateOne(
      { _id: user._id },
      {
        $set: {
          ...successUpdate,
          lastLoginAt: new Date(),
          updatedAt: new Date()
        }
      }
    )

    console.log('✅ 密碼驗證成功，準備生成 JWT Token')

    // 生成 JWT Token
    const token = generateToken(user)

    console.log('🎫 JWT Token 生成成功')

    // 設置 Cookie
    setAuthCookie(event, token)

    // 更新 user 物件以包含最新的 lastLoginAt
    user.lastLoginAt = new Date()
    user.loginAttempts = 0
    user.lockedUntil = undefined

    // 返回使用者資訊（不包含敏感資訊）
    return {
      success: true,
      message: '登入成功',
      user: toAdminUserResponse(user)
    }

  } catch (error: any) {
    // 如果是已知的錯誤，直接拋出
    if (error.statusCode) {
      throw error
    }

    // 未知錯誤
    console.error('登入錯誤:', error)
    throw createError({
      statusCode: 500,
      message: '登入時發生錯誤'
    })
  }
})
