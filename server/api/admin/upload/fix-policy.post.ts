import { getMinioClient, markPolicyConfigured } from '../../../utils/minio'

/**
 * POST /api/admin/upload/fix-policy
 * 修復 MinIO Bucket 的公開讀取權限
 */
export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const client = getMinioClient()
    const bucketName = config.minioBucketName

    if (!bucketName) {
      throw createError({
        statusCode: 500,
        message: 'MinIO Bucket 名稱未設定'
      })
    }

    // 檢查 bucket 是否存在
    const exists = await client.bucketExists(bucketName)
    if (!exists) {
      throw createError({
        statusCode: 404,
        message: `Bucket "${bucketName}" 不存在`
      })
    }

    // 設定公開讀取權限
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }
      ]
    }

    await client.setBucketPolicy(bucketName, JSON.stringify(policy))

    // 標記已設定，避免重複設定
    markPolicyConfigured(bucketName)

    console.log(`✓ MinIO Bucket "${bucketName}" 已設為公開讀取`)

    return {
      success: true,
      message: `Bucket "${bucketName}" 權限已更新為公開讀取`,
      bucketName
    }
  } catch (error: any) {
    console.error('設定 Bucket 權限失敗:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || '設定權限失敗'
    })
  }
})
