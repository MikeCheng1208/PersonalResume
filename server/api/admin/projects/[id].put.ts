/**
 * 更新 Project API (Admin)
 * PUT /api/admin/projects/:id
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

    // 讀取請求資料
    const body = await readBody(event)

    // 驗證必填欄位
    const requiredFields = [
      'projectId', 'title', 'category', 'year', 'description',
      'color', 'coverGradient', 'overview', 'client', 'duration',
      'role', 'tools', 'challenge', 'solution', 'slug'
    ]

    const missingFields = requiredFields.filter(field => !body[field])

    if (missingFields.length > 0) {
      throw createError({
        statusCode: 400,
        message: `缺少必填欄位: ${missingFields.join(', ')}`
      })
    }

    // 檢查 projectId 和 slug 是否與其他作品衝突
    const collection = await getCollection('projects')
    const { ObjectId } = await import('mongodb')

    const conflictProject = await collection.findOne({
      _id: { $ne: new ObjectId(id) },
      $or: [
        { projectId: body.projectId },
        { slug: body.slug }
      ]
    })

    if (conflictProject) {
      throw createError({
        statusCode: 400,
        message: 'Project ID 或 Slug 與其他作品衝突'
      })
    }

    // 準備更新資料
    const updateData = {
      projectId: body.projectId.trim(),
      title: body.title.trim(),
      category: body.category.trim(),
      year: body.year.trim(),
      description: body.description.trim(),
      tags: Array.isArray(body.tags) ? body.tags : [],
      color: body.color.trim(),
      coverImage: body.coverImage?.trim() || '',
      coverGradient: body.coverGradient.trim(),
      overview: body.overview.trim(),
      client: body.client.trim(),
      duration: body.duration.trim(),
      role: body.role.trim(),
      tools: body.tools.trim(),
      challenge: body.challenge.trim(),
      solution: body.solution.trim(),
      images: Array.isArray(body.images) ? body.images : [],
      results: Array.isArray(body.results) ? body.results : [],
      showResults: body.showResults !== undefined ? body.showResults : true,
      published: body.published !== undefined ? body.published : false,
      featured: body.featured !== undefined ? body.featured : false,
      order: body.order !== undefined ? body.order : 0,
      slug: body.slug.trim(),
      metaDescription: body.metaDescription?.trim(),
      metaKeywords: Array.isArray(body.metaKeywords) ? body.metaKeywords : []
    }

    // 更新 Project
    const result = await updateProject(id, updateData)

    if (!result) {
      throw createError({
        statusCode: 404,
        message: '找不到此作品'
      })
    }

    return {
      success: true,
      message: '作品更新成功',
      project: {
        _id: result._id.toString(),
        projectId: result.projectId,
        title: result.title,
        published: result.published,
        updatedAt: result.updatedAt.toISOString()
      }
    }
  } catch (error: any) {
    // 如果是已知的錯誤，直接拋出
    if (error.statusCode) {
      throw error
    }

    // 未知錯誤
    console.error('更新 Project 錯誤:', error)
    throw createError({
      statusCode: 500,
      message: '更新作品時發生錯誤'
    })
  }
})
