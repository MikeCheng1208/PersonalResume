import { deleteFile } from '../../../utils/minio'

/**
 * POST /api/admin/upload/delete
 * 刪除 MinIO 中的圖片
 */
export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const body = await readBody(event)

    if (!body.url) {
      throw createError({
        statusCode: 400,
        message: '請提供要刪除的圖片 URL'
      })
    }

    // 從 URL 中提取 object name
    // URL 格式: https://minio-endpoint/bucket/folder/filename.jpg
    const url = new URL(body.url)
    const pathParts = url.pathname.split('/').filter(Boolean)

    if (pathParts.length < 2) {
      throw createError({
        statusCode: 400,
        message: '無效的圖片 URL'
      })
    }

    // 第一個是 bucket name，剩下的是 object path
    const bucketName = pathParts[0]
    const objectName = pathParts.slice(1).join('/')

    // 確認是我們的 bucket
    if (bucketName !== config.minioBucketName) {
      throw createError({
        statusCode: 400,
        message: '無法刪除此圖片'
      })
    }

    // 刪除檔案
    await deleteFile(bucketName, objectName)

    return {
      success: true,
      message: '圖片刪除成功'
    }
  } catch (error: any) {
    console.error('圖片刪除失敗:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || '圖片刪除失敗，請稍後再試'
    })
  }
})
