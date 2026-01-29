import { Client } from 'minio'

let minioClient: Client | null = null

/**
 * 取得 MinIO Client 實例（單例模式）
 */
export function getMinioClient(): Client {
  if (minioClient) {
    return minioClient
  }

  const config = useRuntimeConfig()

  if (!config.minioEndpoint || !config.minioAccessKey || !config.minioSecretKey) {
    throw new Error('MinIO 設定不完整，請檢查環境變數')
  }

  minioClient = new Client({
    endPoint: config.minioEndpoint,
    port: config.minioUseSSL ? 443 : 9000,
    useSSL: config.minioUseSSL,
    accessKey: config.minioAccessKey,
    secretKey: config.minioSecretKey
  })

  return minioClient
}

/**
 * 確保 Bucket 存在並設定公開讀取權限
 */
export async function ensureBucket(bucketName: string): Promise<void> {
  const client = getMinioClient()

  try {
    const exists = await client.bucketExists(bucketName)
    if (!exists) {
      await client.makeBucket(bucketName)
      console.log(`✓ MinIO Bucket "${bucketName}" 建立成功`)
    }

    // 無論 bucket 是否已存在，都設定公開讀取權限
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
    console.log(`✓ MinIO Bucket "${bucketName}" 已設為公開讀取`)
  } catch (error) {
    console.error('確保 Bucket 存在時發生錯誤:', error)
    throw error
  }
}

/**
 * 上傳檔案到 MinIO
 */
export async function uploadFile(
  bucketName: string,
  objectName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const client = getMinioClient()
  const config = useRuntimeConfig()

  // 確保 bucket 存在
  await ensureBucket(bucketName)

  // 上傳檔案
  await client.putObject(bucketName, objectName, buffer, buffer.length, {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000' // 快取一年
  })

  // 返回公開 URL
  const protocol = config.minioUseSSL ? 'https' : 'http'
  return `${protocol}://${config.minioEndpoint}/${bucketName}/${objectName}`
}

/**
 * 刪除檔案
 */
export async function deleteFile(bucketName: string, objectName: string): Promise<void> {
  const client = getMinioClient()
  await client.removeObject(bucketName, objectName)
}

/**
 * 產生唯一的檔案名稱
 */
export function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg'
  return `${timestamp}-${random}.${extension}`
}

/**
 * 驗證檔案類型
 */
export function isValidImageType(contentType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ]
  return allowedTypes.includes(contentType)
}

/**
 * 取得檔案大小限制（MB）
 */
export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
