/**
 * 新增 Project API (Admin)
 * POST /api/admin/projects
 */

export default defineEventHandler(async (event) => {
  try {
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

    // 檢查 projectId 是否已存在
    const collection = await getCollection('projects')
    const existingProject = await collection.findOne({
      $or: [
        { projectId: body.projectId },
        { slug: body.slug }
      ]
    })

    if (existingProject) {
      throw createError({
        statusCode: 400,
        message: 'Project ID 或 Slug 已存在'
      })
    }

    // 準備資料
    const projectData = {
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

    // 建立 Project
    const result = await createProject(projectData)

    // 取得新建立的 Project
    const newProject = await collection.findOne({ _id: result.insertedId })

    if (!newProject) {
      throw createError({
        statusCode: 500,
        message: '建立作品後無法取得資料'
      })
    }

    return {
      success: true,
      message: '作品建立成功',
      project: {
        _id: newProject._id.toString(),
        projectId: newProject.projectId,
        title: newProject.title,
        published: newProject.published
      }
    }
  } catch (error: any) {
    // 如果是已知的錯誤，直接拋出
    if (error.statusCode) {
      throw error
    }

    // 未知錯誤
    console.error('建立 Project 錯誤:', error)
    throw createError({
      statusCode: 500,
      message: '建立作品時發生錯誤'
    })
  }
})
