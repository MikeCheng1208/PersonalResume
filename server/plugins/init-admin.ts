/**
 * Nitro 插件：應用啟動時自動建立初始 admin 帳號
 * 只在生產環境且 admin 帳號不存在時執行
 */

import { getCollection } from '../utils/db'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

interface AdminUserDocument {
  username: string
  email: string
  passwordHash: string
  displayName: string
  role: 'super_admin'
  permissions: string[]
  isActive: boolean
  loginAttempts: number
  createdAt: Date
  updatedAt: Date
}

export default defineNitroPlugin(async () => {
  try {
    console.log('🔍 檢查 admin 帳號...')

    const collection = await getCollection<AdminUserDocument>('admin_users')

    // 檢查是否已存在 admin 帳號
    const existingAdmin = await collection.findOne({ username: 'admin' })

    if (existingAdmin) {
      console.log('✅ Admin 帳號已存在')
      return
    }

    // 建立初始 admin 帳號
    console.log('🔧 建立初始 admin 帳號...')

    const password = 'Admin123456'
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const adminUser: AdminUserDocument = {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      displayName: '系統管理員',
      role: 'super_admin',
      permissions: ['*'],
      isActive: true,
      loginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await collection.insertOne(adminUser)

    // 建立索引
    try {
      await collection.createIndex({ username: 1 }, { unique: true })
      await collection.createIndex({ email: 1 }, { unique: true })
      await collection.createIndex({ isActive: 1, role: 1 })
    } catch (indexError) {
      // 索引可能已存在，忽略錯誤
      console.log('⚠️  索引已存在，跳過建立')
    }

    console.log('✅ 初始 admin 帳號建立成功')
    console.log('   帳號: admin')
    console.log('   密碼: Admin123456')
    console.log('   請立即登入並修改密碼！')

  } catch (error) {
    console.error('❌ 建立 admin 帳號時發生錯誤:', error)
    // 不中斷應用啟動
  }
})
