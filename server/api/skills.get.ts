import { getVisibleSkills } from '../utils/db-helpers'
import type { SkillCategory } from '~/app/types/api'

/**
 * GET /api/skills
 * 獲取技能列表
 */
export default defineEventHandler(async (): Promise<SkillCategory[]> => {
  try {
    const skills = await getVisibleSkills()
    return skills as SkillCategory[]
  } catch (error: any) {
    console.error('獲取技能列表失敗:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '獲取技能列表失敗'
    })
  }
})
