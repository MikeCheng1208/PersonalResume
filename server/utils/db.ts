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
  if (client && client.topology && client.topology.isConnected()) {
    return client
  }

  const config = useRuntimeConfig()
  const uri = config.mongodbUri

  if (!uri) {
    throw new Error('MONGODB_URI 環境變數未設定')
  }

  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    await client.connect()
    console.log('✅ MongoDB 連線成功')
    return client
  } catch (error) {
    console.error('❌ MongoDB 連線失敗:', error)
    throw error
  }
}

/**
 * 獲取資料庫實例
 */
export async function getDatabase(): Promise<Db> {
  if (db) {
    return db
  }

  const config = useRuntimeConfig()
  const dbName = config.mongodbDatabase || 'zeabur'

  const mongoClient = await getMongoClient()
  db = mongoClient.db(dbName)

  return db
}

/**
 * 獲取指定的 Collection
 * @param collectionName Collection 名稱
 */
export async function getCollection<T = any>(collectionName: string): Promise<Collection<T>> {
  const database = await getDatabase()
  return database.collection<T>(collectionName)
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
