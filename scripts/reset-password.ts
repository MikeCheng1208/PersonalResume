#!/usr/bin/env node
import 'dotenv/config'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcrypt'

const MONGODB_URI = process.env.MONGODB_URI || ''
const SALT_ROUNDS = 10

async function resetPassword() {
  console.log('========================================')
  console.log('   重置管理員密碼')
  console.log('========================================\n')

  if (!MONGODB_URI) {
    console.error('❌ 錯誤: 未設定 MONGODB_URI 環境變數')
    process.exit(1)
  }

  // MongoDB 連接選項
  // Zeabur 的 MongoDB 通常不需要 TLS
  const options = {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    maxPoolSize: 10,
    retryWrites: true,
    retryReads: true,
  }

  const client = new MongoClient(MONGODB_URI, options)

  try {
    console.log('📡 連接資料庫...')
    console.log(`   URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`)
    await client.connect()

    // 測試連接
    await client.db('admin').command({ ping: 1 })
    console.log('✅ 資料庫連接成功')

    const dbName = process.env.MONGODB_DATABASE || 'zeabur'
    const db = client.db(dbName)
    const adminUsersCollection = db.collection('admin_users')

    // 新密碼
    const newPassword = 'Admin123456'
    console.log('🔐 加密新密碼...')
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

    // 更新密碼
    const result = await adminUsersCollection.updateOne(
      { username: 'admin' },
      {
        $set: {
          passwordHash,
          loginAttempts: 0,
          lockedUntil: null,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      console.log('❌ 找不到 admin 帳號')
      console.log('正在創建新的管理員帳號...')

      await adminUsersCollection.insertOne({
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
      })

      console.log('\n✅ 管理員帳號創建成功!')
    } else {
      console.log('\n✅ 密碼重置成功!')
    }

    console.log('\n帳號資訊:')
    console.log('   帳號: admin')
    console.log('   密碼: Admin123456')
    console.log('   Email: admin@example.com')
    console.log('   角色: super_admin')
    console.log('\n========================================')
    console.log('現在可以使用以上帳號密碼登入後台系統')
    console.log('登入網址: http://localhost:3001/admin/login')
    console.log('========================================\n')

  } catch (error) {
    console.error('\n❌ 錯誤:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

resetPassword()
