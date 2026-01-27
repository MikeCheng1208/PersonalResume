import { MongoClient, Db, Collection } from 'mongodb'

/**
 * MongoDB 連線管理
 * 使用單例模式管理資料庫連線
 */

let client: MongoClient | null = null
let db: Db | null = null

/**
 * 獲取 MongoDB 客戶端
 */
export async function getMongoClient(): Promise<MongoClient> {
  // 檢查現有連線是否有效
  if (client) {
    try {
      // 嘗試 ping 測試連線
      await client.db('admin').command({ ping: 1 })
      return client
    } catch (error) {
      // 連線已失效,清除並重新連線
      console.log('⚠️ MongoDB 連線已失效,正在重新連線...')
      client = null
      db = null
    }
  }

  const config = useRuntimeConfig()
  const uri = config.mongodbUri

  if (!uri) {
    throw new Error('MONGODB_URI 環境變數未設定')
  }

  try {
    console.log('🔌 正在連接 MongoDB...')
    console.log('   URI 預覽:', uri.substring(0, 30) + '...')

    // Zeabur MongoDB 連接選項
    // 注意：Zeabur 的 MongoDB 通常不需要 TLS
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 30000, // 增加到 30 秒
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000, // 增加到 30 秒
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      // 重要：添加這些選項來改善連接穩定性
      maxIdleTimeMS: 300000, // 5 分鐘
      waitQueueTimeoutMS: 10000,
    })

    await client.connect()

    // 測試連接
    await client.db('admin').command({ ping: 1 })

    console.log('✅ MongoDB 連線成功')
    return client
  } catch (error: any) {
    console.error('❌ MongoDB 連線失敗')
    console.error('   錯誤類型:', error.constructor.name)
    console.error('   錯誤訊息:', error.message)
    console.error('   完整錯誤:', error)
    client = null
    db = null
    throw error
  }
}

/**
 * 獲取資料庫實例
 */
export async function getDatabase(): Promise<Db> {
  const config = useRuntimeConfig()
  const dbName = config.mongodbDatabase || 'zeabur'

  // 每次都重新獲取 client 以確保連線有效
  const mongoClient = await getMongoClient()
  db = mongoClient.db(dbName)

  return db
}

/**
 * 獲取指定的 Collection（帶重試機制）
 * @param collectionName Collection 名稱
 * @param maxRetries 最大重試次數
 */
export async function getCollection<T = any>(
  collectionName: string,
  maxRetries: number = 3
): Promise<Collection<T>> {
  let lastError: any

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const database = await getDatabase()
      const collection = database.collection<T>(collectionName)

      // 測試連接是否真的可用（使用 countDocuments 因為它很輕量）
      if (attempt > 0) {
        await collection.estimatedDocumentCount()
        console.log(`✅ 重試成功 (第 ${attempt + 1} 次嘗試)`)
      }

      return collection
    } catch (error: any) {
      lastError = error
      console.error(`⚠️ 獲取 Collection 失敗 (嘗試 ${attempt + 1}/${maxRetries})`)
      console.error('   錯誤:', error.message)

      // 如果不是最後一次嘗試，等待一下再重試
      if (attempt < maxRetries - 1) {
        // 清除現有連接，強制重新連接
        client = null
        db = null

        // 指數退避：等待時間遞增
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000)
        console.log(`   等待 ${waitTime}ms 後重試...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  // 所有重試都失敗
  console.error(`❌ 獲取 Collection "${collectionName}" 失敗，已重試 ${maxRetries} 次`)
  throw lastError
}

/**
 * 測試資料庫連線
 */
export async function testConnection(): Promise<boolean> {
  try {
    const mongoClient = await getMongoClient()
    await mongoClient.db('admin').command({ ping: 1 })
    console.log('✅ MongoDB 連線測試成功')
    return true
  } catch (error) {
    console.error('❌ MongoDB 連線測試失敗:', error)
    return false
  }
}

/**
 * 關閉資料庫連線
 */
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close()
    client = null
    db = null
    console.log('MongoDB 連線已關閉')
  }
}

/**
 * 獲取資料庫統計資訊
 */
export async function getDatabaseStats() {
  try {
    const database = await getDatabase()
    const stats = await database.stats()
    return {
      database: stats.db,
      collections: stats.collections,
      dataSize: stats.dataSize,
      indexSize: stats.indexSize,
      storageSize: stats.storageSize
    }
  } catch (error) {
    console.error('獲取資料庫統計失敗:', error)
    throw error
  }
}
