import { getPublishedProjects } from '../../utils/db-helpers'
import type { ProjectCard } from '~/app/types/api'

/**
 * GET /api/projects
 * 獲取作品列表 (首頁用)
 */
export default defineEventHandler(async (): Promise<ProjectCard[]> => {
  try {
    const projects = await getPublishedProjects()
    return projects as ProjectCard[]
  } catch (error: any) {
    console.error('獲取作品列表失敗:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '獲取作品列表失敗'
    })
  }
})
