import { Client } from 'minio'

let minioClient: Client | null = null
let policyConfigured: Set<string> = new Set()

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
 * 會檢查現有 policy，若已是公開則跳過設定
 */
export async function ensureBucket(bucketName: string): Promise<void> {
  // 如果這次伺服器運行中已經確認過，就跳過
  if (policyConfigured.has(bucketName)) {
    return
  }

  const client = getMinioClient()

  try {
    // 確保 bucket 存在
    const exists = await client.bucketExists(bucketName)
    if (!exists) {
      await client.makeBucket(bucketName)
      console.log(`✓ MinIO Bucket "${bucketName}" 建立成功`)
    }

    // 檢查現有 policy 是否已經是公開讀取
    let needSetPolicy = true
    try {
      const currentPolicy = await client.getBucketPolicy(bucketName)
      const parsed = JSON.parse(currentPolicy)

      // 檢查是否已有公開讀取的 Statement
      const hasPublicRead = parsed.Statement?.some((stmt: any) =>
        stmt.Effect === 'Allow' &&
        stmt.Action?.includes('s3:GetObject') &&
        (stmt.Principal === '*' || stmt.Principal?.AWS?.includes('*'))
      )

      if (hasPublicRead) {
        needSetPolicy = false
        console.log(`✓ MinIO Bucket "${bucketName}" 已有公開讀取權限，跳過設定`)
      }
    } catch (e: any) {
      // 如果沒有 policy 或解析失敗，就需要設定
      if (e.code !== 'NoSuchBucketPolicy') {
        console.warn('檢查 Bucket Policy 時發生錯誤:', e.message)
      }
    }

    // 只有在需要時才設定 policy
    if (needSetPolicy) {
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
    }

    // 標記已確認（無論是否設定，都不需要再檢查）
    policyConfigured.add(bucketName)
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

/**
 * 標記 Bucket 的 policy 已設定（供外部 API 使用）
 */
export function markPolicyConfigured(bucketName: string): void {
  policyConfigured.add(bucketName)
}
