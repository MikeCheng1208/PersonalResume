/**
 * 安全相關工具函數
 * 防護 NoSQL Injection、XSS、輸入驗證等
 */

import type { H3Event } from 'h3'

/**
 * Rate Limiter 記憶體儲存
 * 正式環境建議使用 Redis
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate Limiter 設定
 */
interface RateLimitConfig {
  windowMs: number      // 時間窗口（毫秒）
  maxAttempts: number   // 最大嘗試次數
  keyPrefix?: string    // key 前綴
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 分鐘
  maxAttempts: 10,          // 最多 10 次
  keyPrefix: 'rl:'
}

/**
 * 登入專用的 Rate Limit 設定（更嚴格）
 */
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 分鐘
  maxAttempts: 5,           // 最多 5 次（搭配帳號鎖定機制）
  keyPrefix: 'login:'
}

/**
 * 取得客戶端 IP
 */
export function getClientIP(event: H3Event): string {
  // 依序檢查各種 header
  const forwardedFor = getHeader(event, 'x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for 可能包含多個 IP，取第一個
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = getHeader(event, 'x-real-ip')
  if (realIP) {
    return realIP
  }

  // Cloudflare
  const cfConnectingIP = getHeader(event, 'cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // 最後使用 socket 地址
  return event.node.req.socket?.remoteAddress || 'unknown'
}

/**
 * 檢查 Rate Limit
 * 返回是否允許請求
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const fullKey = `${config.keyPrefix}${key}`
  const record = rateLimitStore.get(fullKey)

  // 清理過期記錄
  if (record && now > record.resetTime) {
    rateLimitStore.delete(fullKey)
  }

  const current = rateLimitStore.get(fullKey)

  if (!current) {
    // 新記錄
    rateLimitStore.set(fullKey, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetIn: config.windowMs
    }
  }

  // 檢查是否超過限制
  if (current.count >= config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: current.resetTime - now
    }
  }

  // 增加計數
  current.count++
  return {
    allowed: true,
    remaining: config.maxAttempts - current.count,
    resetIn: current.resetTime - now
  }
}

/**
 * 重置 Rate Limit（登入成功時使用）
 */
export function resetRateLimit(key: string, keyPrefix: string = 'login:'): void {
  rateLimitStore.delete(`${keyPrefix}${key}`)
}

/**
 * 驗證字串是否為安全的輸入（防止 NoSQL Injection）
 * MongoDB 運算子都以 $ 開頭，需要過濾
 */
export function isSafeString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  // 檢查是否為空
  if (value.trim().length === 0) {
    return false
  }

  return true
}

/**
 * 檢查物件是否包含 MongoDB 運算子（NoSQL Injection 防護）
 */
export function containsMongoOperator(obj: unknown): boolean {
  if (obj === null || obj === undefined) {
    return false
  }

  if (typeof obj === 'string') {
    // 字串中的 $ 通常是安全的
    return false
  }

  if (typeof obj === 'object') {
    // 如果是物件，檢查是否有以 $ 開頭的 key
    for (const key of Object.keys(obj as object)) {
      if (key.startsWith('$')) {
        return true
      }
      // 遞迴檢查巢狀物件
      if (containsMongoOperator((obj as Record<string, unknown>)[key])) {
        return true
      }
    }
  }

  return false
}

/**
 * 清理並驗證登入輸入
 */
export function sanitizeLoginInput(input: unknown): {
  valid: boolean
  username?: string
  password?: string
  error?: string
} {
  // 檢查輸入是否為物件
  if (!input || typeof input !== 'object') {
    return { valid: false, error: '無效的請求格式' }
  }

  const body = input as Record<string, unknown>

  // 檢查 NoSQL Injection
  if (containsMongoOperator(body)) {
    console.warn('🚨 偵測到潛在的 NoSQL Injection 攻擊')
    return { valid: false, error: '無效的請求格式' }
  }

  const { username, password } = body

  // 驗證 username
  if (!isSafeString(username)) {
    return { valid: false, error: '請提供有效的帳號' }
  }

  // 驗證 password
  if (!isSafeString(password)) {
    return { valid: false, error: '請提供有效的密碼' }
  }

  // 帳號長度限制（3-50 字元）
  if (username.length < 3 || username.length > 50) {
    return { valid: false, error: '帳號長度需在 3-50 字元之間' }
  }

  // 密碼長度限制（6-100 字元）
  if (password.length < 6 || password.length > 100) {
    return { valid: false, error: '密碼長度需在 6-100 字元之間' }
  }

  // 帳號只允許英文字母、數字、底線
  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(username)) {
    return { valid: false, error: '帳號只能包含英文字母、數字和底線' }
  }

  return {
    valid: true,
    username: username.trim(),
    password: password
  }
}

/**
 * 清理一般字串輸入（移除危險字元）
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    // 移除 null bytes
    .replace(/\0/g, '')
    // 移除控制字元（保留換行和 tab）
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * 清理 MongoDB 查詢輸入
 * 確保輸入是純字串，而非可能的運算子物件
 */
export function sanitizeMongoInput<T>(input: T): T {
  if (input === null || input === undefined) {
    return input
  }

  // 如果是字串，直接返回
  if (typeof input === 'string') {
    return sanitizeString(input) as T
  }

  // 如果是陣列，遞迴處理
  if (Array.isArray(input)) {
    return input.map(item => sanitizeMongoInput(item)) as T
  }

  // 如果是物件，檢查並清理
  if (typeof input === 'object') {
    const sanitized: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(input as object)) {
      // 跳過以 $ 開頭的 key（防止運算子注入）
      if (key.startsWith('$')) {
        console.warn(`🚨 移除潛在的 MongoDB 運算子: ${key}`)
        continue
      }
      sanitized[key] = sanitizeMongoInput(value)
    }
    return sanitized as T
  }

  return input
}

/**
 * 產生安全的隨機字串
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }
  return result
}

/**
 * 清理定期過期的 rate limit 記錄
 * 建議定期呼叫（例如每小時）
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// 每小時清理一次過期記錄
setInterval(cleanupRateLimitStore, 60 * 60 * 1000)
