import { testConnection, getDatabaseStats } from '../utils/db'

/**
 * GET /api/db-test
 * 測試 MongoDB 連線
 */
export default defineEventHandler(async (event) => {
  try {
    const isConnected = await testConnection()

    if (isConnected) {
      // 獲取資料庫統計資訊
      try {
        const stats = await getDatabaseStats()
        return {
          success: true,
          message: 'MongoDB 連線成功！',
          database: stats.database,
          collections: stats.collections,
          dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
          indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`,
          storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
          timestamp: new Date().toISOString()
        }
      } catch (statsError) {
        // 即使獲取統計失敗，連線仍然成功
        return {
          success: true,
          message: 'MongoDB 連線成功！',
          note: '無法獲取資料庫統計（可能資料庫為空）',
          timestamp: new Date().toISOString()
        }
      }
    } else {
      setResponseStatus(event, 500)
      return {
        success: false,
        message: 'MongoDB 連線失敗',
        timestamp: new Date().toISOString()
      }
    }
  } catch (error: any) {
    setResponseStatus(event, 500)
    return {
      success: false,
      message: 'MongoDB 連線錯誤',
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
})
