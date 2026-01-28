# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案簡介

這是一個使用 Nuxt 4 建立的個人作品集網站,包含前台展示和後台管理系統。前台採用 SSR 以優化 SEO,後台採用 CSR 提供即時互動體驗。使用 MongoDB 儲存資料,JWT + httpOnly Cookie 進行認證。

## 常用開發指令

### 基礎開發
```bash
# 安裝依賴
npm install

# 啟動開發伺服器 (http://localhost:3000)
npm run dev

# 建置生產版本 (SSR)
npm run build

# 預覽生產版本
npm run preview

# 生成靜態網站
npm run generate

# 啟動生產伺服器
npm run start
```

### 資料庫管理
```bash
# 建立或更新管理員帳號（互動式）
npm run seed:admin

# 快速重置 admin 密碼為 Admin123456
npm run reset-password
```

### TypeScript 執行（用於腳本）
```bash
# 直接執行 TypeScript 腳本
tsx scripts/your-script.ts
```

## 高層次架構

### 認證與授權系統

**認證流程**
- 使用者登入 → 密碼驗證（bcrypt, 10 rounds）→ 生成 JWT（7 天有效期）→ 設置 httpOnly Cookie
- Cookie 優先,備用 Authorization header (`Bearer <token>`)
- 登入失敗 5 次後鎖定帳號 15 分鐘
- JWT Payload 包含：userId, username, role, permissions

**中介軟體保護機制**
- **後端**: `/server/middleware/admin-auth.ts` 保護所有 `/api/admin/*` 路由（除登入和除錯端點）
- **前端**: `/app/middleware/admin-auth.ts` 保護所有 `/admin/*` 頁面（除登入頁）
- 認證失敗自動導向 `/admin/login`

**角色與權限體系** (`app/types/permissions.ts`)
- **super_admin**: 擁有 `*`（所有權限）
- **admin**: 無法刪除使用者帳號
- **editor**: 僅可編輯內容,無刪除和發布權限

權限格式：`resource:action`（如 `projects:write`、`users:delete`）
支援通配符：`projects:*` 或 `*`

**核心認證函數** (`server/utils/auth.ts`)
```typescript
hashPassword(password)              // bcrypt 加密
verifyPassword(password, hash)      // 密碼驗證
generateToken(payload)              // 生成 JWT
verifyToken(token)                  // 驗證 JWT
getCurrentUser(event)               // 從請求提取使用者資訊
setAuthCookie(event, token)         // 設置 httpOnly Cookie
```

**前端認證管理** (`app/composables/admin/useAdminAuth.ts`)
```typescript
const { user, isAuthenticated, login, logout, fetchUser, hasPermission, hasRole } = useAdminAuth()
```

### 資料庫架構

**連接管理** (`server/utils/db.ts`)
- 單例模式,避免重複連接
- 連接池：最大 10,最小 2
- 自動重試機制：最多 3 次,指數退避（1s → 2s → 4s → 5s）
- 超時設定：伺服器選擇 30s,Socket 60s,連接 30s
- 空閒連接自動關閉：5 分鐘

**核心函數**
```typescript
await getDatabase()                  // 取得資料庫實例
await getCollection('collectionName') // 取得集合（帶重試）
await testConnection()               // 測試連接
```

**Collections 結構** (`app/types/database.ts`)

1. **admin_users** - 後台使用者
   - 索引：`username` (unique), `email` (unique), `isActive + role`
   - 欄位：username, email, passwordHash, role, permissions, loginAttempts, lockedUntil

2. **projects** - 作品集
   - 索引：`projectId` (unique), `slug` (unique), `published + order`, `featured + published`
   - 欄位：title, category, year, tags, images[], results[], published, featured, order
   - 詳細欄位：overview, client, duration, role, tools, challenge, solution

3. **profile** - 個人資訊
   - 索引：`isActive`
   - 欄位：name, nameEn, title, bio[], philosophy, photo, heroTitle, heroSubtitle

4. **skills** - 技能分類
   - 索引：`categoryId` (unique), `order + isVisible`
   - 欄位：title, skills[], order, isVisible

5. **contact** - 聯絡資訊
   - 索引：`isActive`
   - 欄位：text, links[], isActive

**輔助查詢函數** (`server/utils/db-helpers.ts`)
```typescript
// 公開 API 使用
await getActiveProfile()
await getPublishedProjects()
await getProjectById(projectId)
await getVisibleSkills()
await getActiveContact()

// 後台使用
await getAllProjectsForAdmin()       // 含未發布作品
```

### API 路由結構

**公開 API** (`/server/api/public/`)
- 無需認證
- 僅返回已發布/啟用的資料
- 範例：`GET /api/public/projects`, `GET /api/public/profile`

**後台 API** (`/server/api/admin/`)
- 需 JWT 認證
- 支援完整 CRUD 操作
- 路由範例：
  ```
  /api/admin/auth/login.post.ts       登入
  /api/admin/projects/index.get.ts    取得所有作品（含未發布）
  /api/admin/projects/[id].put.ts     編輯作品
  /api/admin/projects/[id]/publish.post.ts  發布作品
  /api/admin/users/[id]/reset-password.post.ts  重置使用者密碼
  ```

**API 設計規範**
- RESTful 設計（GET, POST, PUT, DELETE）
- 檔名自動對應路由：`login.post.ts` → `POST /api/admin/auth/login`
- 動態參數使用 `[id]` 語法
- 錯誤統一返回 `{ statusCode, message }`
- 成功返回 `{ data, message? }`

### 前端架構

**頁面路由**
```
/                              首頁（作品集展示）
/work/[id]                     作品詳情頁
/admin/login                   後台登入
/admin/dashboard               儀表板
/admin/profile                 編輯個人資訊
/admin/projects                作品列表
/admin/projects/new            新建作品
/admin/projects/[id]           編輯作品
/admin/skills                  編輯技能
/admin/users                   使用者管理
/admin/contact                 編輯聯絡資訊
```

**關鍵組件** (`app/components/`)
- `admin/AdminLayout.vue` - 後台布局（側邊欄 + 主內容）
- `admin/AdminSidebar.vue` - 側邊欄導航
- `admin/ImageUpload.vue` - 圖片上傳組件
- `Lightbox.vue` - 圖片燈箱

**Composables** (`app/composables/admin/`)
- `useAdminAuth()` - 認證管理
- `useAdminAPI()` - API 請求封裝
- `useErrorHandler()` - 錯誤處理

### 環境變數配置

**必要變數** (參考 `.env.example`)
```bash
# MongoDB 連接（二選一）
MONGO_URI="mongodb://username:password@host:port"
# 或
MONGO_USERNAME="..."
MONGO_PASSWORD="..."
MONGO_HOST="..."
MONGO_PORT="27017"
MONGO_DATABASE="..."

# JWT 認證（至少 32 字元）
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"

# Cookie 安全設定（生產環境設為 true）
COOKIE_SECURE="false"
```

**配置映射** (`nuxt.config.ts` → `runtimeConfig`)
- 後端使用：`useRuntimeConfig().mongodbUri`
- 前端無法存取這些敏感變數

### 初始化與管理腳本

**自動初始化** (`server/plugins/init-admin.ts`)
- 應用啟動時自動執行
- 若無 admin 帳號則建立預設帳號（admin / Admin123456）
- 若已存在則跳過（不會覆蓋）
- 非阻斷性：失敗不影響應用啟動

**手動腳本**
- `npm run seed:admin` - 互動式建立/更新管理員（推薦用於正式環境）
- `npm run reset-password` - 緊急重置密碼為 Admin123456

## 開發重點

### Vue SFC 組件規範

**組件欄位順序**: 所有 Vue 單文件組件必須遵循以下順序：
1. `<script setup>` 或 `<script setup lang="ts">`
2. `<template>`
3. `<style scoped>`

**開發風格**: 本專案使用 **Vue 3 Composition API + `<script setup>` 語法**

範例組件結構：
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  title: string
  count?: number
}
const props = withDefaults(defineProps<Props>(), {
  count: 0
})

// Emits
const emit = defineEmits<{
  update: [value: string]
  delete: []
}>()

// State
const message = ref('Hello')
const displayText = computed(() => `${props.title}: ${message.value}`)

// Methods
function handleClick() {
  emit('update', message.value)
}
</script>

<template>
  <div class="component">
    <h2>{{ displayText }}</h2>
    <button @click="handleClick">
      Click me
    </button>
  </div>
</template>

<style scoped>
.component {
  padding: 1rem;
}
</style>
```

**重要提醒**:
- 永遠使用 `<script setup>` 而非 Options API
- 使用 TypeScript 定義 Props 和 Emits 的型別
- 使用 Composition API 的 `ref()`, `computed()`, `watch()` 等
- 避免使用 Options API 語法（`data()`, `methods`, `computed` 物件等）

### 新增 API 路由
1. 在 `/server/api/` 適當位置建立檔案（如 `[method].ts`）
2. 認證保護的路由放在 `/api/admin/` 下
3. 使用 `getCurrentUser(event)` 取得當前使用者
4. 使用 `hasPermission(user, 'resource:action')` 檢查權限
5. 資料庫操作使用 `await getCollection('collectionName')`

### 新增後台頁面
1. 在 `/app/pages/admin/` 建立 `.vue` 檔案
2. 頁面自動受 `admin-auth` 中介軟體保護
3. 使用 `<AdminLayout>` 包裹內容以獲得統一布局
4. 使用 `useAdminAuth()` 存取使用者資訊和權限檢查

### 資料庫操作範例
```typescript
// 讀取
const collection = await getCollection('projects')
const project = await collection.findOne({ projectId: 'my-project' })

// 新增
await collection.insertOne({
  ...data,
  createdAt: new Date(),
  updatedAt: new Date()
})

// 更新
await collection.updateOne(
  { _id: toObjectId(id) },
  { $set: { ...data, updatedAt: new Date() } }
)

// 刪除
await collection.deleteOne({ _id: toObjectId(id) })
```

### 權限檢查範例
```typescript
// 前端
const { hasPermission, hasRole } = useAdminAuth()
const canEdit = hasPermission('projects:write')
const isSuperAdmin = hasRole('super_admin')

// 後端
const user = await getCurrentUser(event)
if (!hasPermission(user, 'projects:write')) {
  throw createError({ statusCode: 403, message: '無權限執行此操作' })
}
```

### 錯誤處理
- 使用 `createError({ statusCode, message })` 拋出 HTTP 錯誤
- 前端使用 `useErrorHandler()` 統一處理錯誤顯示
- 資料庫連接失敗會自動重試（最多 3 次）

### 安全注意事項
- **永不** 在前端程式碼中硬編碼密碼或 Token
- **永不** 在公開 API 返回敏感資訊（passwordHash, JWT Secret）
- 新增 API 時確保適當的認證和權限檢查
- 使用者輸入必須驗證和清理（防 NoSQL Injection）
- 生產環境務必設定 `COOKIE_SECURE=true` 和強 JWT Secret

### 常見任務快速參考

**修改個人資訊**
- 前台顯示：查詢 `profile` collection, `isActive: true`
- 後台編輯：`/app/pages/admin/profile/index.vue`
- API：`PUT /api/admin/profile`

**作品管理**
- 前台列表：`GET /api/public/projects`（僅 `published: true`）
- 後台列表：`GET /api/admin/projects`（含未發布）
- 發布作品：`POST /api/admin/projects/[id]/publish`

**使用者管理**
- 建立使用者：`POST /api/admin/users`（需 `users:write` 權限）
- 刪除使用者：`DELETE /api/admin/users/[id]`（僅 `super_admin`）
- 重置密碼：`POST /api/admin/users/[id]/reset-password`

**除錯工具**
- 環境變數檢查：`GET /api/admin/debug/env-check`
- 資料庫連接測試：`GET /api/public/db-test`
- MongoDB 統計：呼叫 `getDatabaseStats()` 工具函數

## 技術棧

- **框架**: Nuxt 4（Vue 3 + TypeScript）
- **UI**: @nuxt/ui（Tailwind CSS 4）
- **資料庫**: MongoDB（官方驅動）
- **認證**: JWT + bcrypt
- **部署**: 支援 SSR（`npm run build`）和靜態生成（`npm run generate`）
