import {
  uploadFile,
  generateFileName,
  isValidImageType,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES
} from '../../../utils/minio'

/**
 * POST /api/admin/upload/image
 * 上傳圖片到 MinIO
 */
export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()

    // 檢查 MinIO 設定
    if (!config.minioEndpoint || !config.minioBucketName) {
      throw createError({
        statusCode: 500,
        message: 'MinIO 設定不完整，請聯繫管理員'
      })
    }

    // 解析 multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        message: '請選擇要上傳的檔案'
      })
    }

    // 取得檔案
    const fileField = formData.find(field => field.name === 'file')

    if (!fileField || !fileField.data) {
      throw createError({
        statusCode: 400,
        message: '未找到上傳的檔案'
      })
    }

    // 取得 folder（可選）
    const folderField = formData.find(field => field.name === 'folder')
    const folder = folderField?.data?.toString() || 'images'

    // 驗證檔案類型
    const contentType = fileField.type || 'application/octet-stream'
    if (!isValidImageType(contentType)) {
      throw createError({
        statusCode: 400,
        message: '不支援的檔案格式，請上傳 JPG、PNG、GIF、WebP 或 SVG 圖片'
      })
    }

    // 驗證檔案大小
    if (fileField.data.length > MAX_FILE_SIZE_BYTES) {
      throw createError({
        statusCode: 400,
        message: `檔案過大，最大允許 ${MAX_FILE_SIZE_MB}MB`
      })
    }

    // 產生唯一檔名
    const originalName = fileField.filename || 'image.jpg'
    const fileName = generateFileName(originalName)
    const objectName = `${folder}/${fileName}`

    // 上傳到 MinIO
    const url = await uploadFile(
      config.minioBucketName,
      objectName,
      fileField.data,
      contentType
    )

    return {
      success: true,
      message: '圖片上傳成功',
      data: {
        url,
        fileName,
        originalName,
        size: fileField.data.length,
        contentType
      }
    }
  } catch (error: any) {
    console.error('圖片上傳失敗:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || '圖片上傳失敗，請稍後再試'
    })
  }
})
