import { getProjectById } from '../../utils/db-helpers'
import type { ProjectDetail } from '~/app/types/api'

/**
 * GET /api/projects/:id
 * 獲取特定作品的詳細資訊
 */
export default defineEventHandler(async (event): Promise<ProjectDetail | null> => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少作品 ID'
      })
    }

    const project = await getProjectById(id)

    if (!project) {
      setResponseStatus(event, 404)
      return null
    }

    return project as ProjectDetail
  } catch (error: any) {
    console.error('獲取作品詳情失敗:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '獲取作品詳情失敗'
    })
  }
})
