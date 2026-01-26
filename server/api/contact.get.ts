import { getActiveContact } from '../utils/db-helpers'
import type { ContactInfo } from '~/app/types/api'

/**
 * GET /api/contact
 * 獲取聯絡資訊
 */
export default defineEventHandler(async (): Promise<ContactInfo> => {
  try {
    const contact = await getActiveContact()

    if (!contact) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到聯絡資訊'
      })
    }

    return contact as ContactInfo
  } catch (error: any) {
    console.error('獲取聯絡資訊失敗:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '獲取聯絡資訊失敗'
    })
  }
})
