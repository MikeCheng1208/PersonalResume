import { getActiveProfile } from '../utils/db-helpers'
import type { Profile } from '~/app/types/api'

/**
 * GET /api/profile
 * 獲取個人基本資訊
 */
export default defineEventHandler(async (): Promise<Profile> => {
  try {
    const profile = await getActiveProfile()

    if (!profile) {
      throw createError({
        statusCode: 404,
        statusMessage: '找不到個人資訊'
      })
    }

    return profile as Profile
  } catch (error: any) {
    console.error('獲取個人資訊失敗:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '獲取個人資訊失敗'
    })
  }
})
