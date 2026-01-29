/**
 * 取得單筆 Project 資料 API (Admin)
 * GET /api/admin/projects/:id
 * 包含完整資料
 */

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: '缺少作品 ID'
      })
    }

    // 取得 Project 資料
    const project = await getProjectByIdForAdmin(id)

    if (!project) {
      throw createError({
        statusCode: 404,
        message: '找不到此作品'
      })
    }

    // 轉換為 API 回應格式
    return {
      success: true,
      project: {
        _id: project._id.toString(),
        projectId: project.projectId,
        title: project.title,
        category: project.category,
        year: project.year,
        description: project.description,
        tags: project.tags,
        color: project.color,
        coverImage: project.coverImage || '',
        coverGradient: project.coverGradient,
        overview: project.overview,
        client: project.client,
        duration: project.duration,
        role: project.role,
        tools: project.tools,
        challenge: project.challenge,
        solution: project.solution,
        images: project.images,
        results: project.results,
        showResults: project.showResults !== false,
        published: project.published,
        featured: project.featured,
        order: project.order,
        slug: project.slug,
        metaDescription: project.metaDescription,
        metaKeywords: project.metaKeywords,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      }
    }
  } catch (error: any) {
    // 如果是已知的錯誤，直接拋出
    if (error.statusCode) {
      throw error
    }

    // 未知錯誤
    console.error('取得 Project 錯誤:', error)
    throw createError({
      statusCode: 500,
      message: '取得作品資料時發生錯誤'
    })
  }
})
