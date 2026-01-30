# Designer Portfolio System

<p align="center">
  <img src="./public/readme-cover.svg" alt="Designer Portfolio System - 6 Themes" width="100%">
</p>

一個專為設計師打造的作品集網站系統。只需簡單部署到 Zeabur，即可擁有一個專業、美觀的個人作品集網站。

## 特色功能

### 前台展示
- 極簡優雅的設計風格
- 流暢的動畫與微互動效果
- 完整響應式設計（桌機、平板、手機）
- SEO 優化（SSR 伺服器端渲染）
- 作品集展示與詳情頁
- 個人簡介與技能展示
- 聯絡資訊整合

### 後台管理
- 直覺的管理介面
- 作品 CRUD（新增、編輯、刪除、發布）
- 個人資料管理
- 技能分類管理
- 聯絡資訊管理
- 使用者權限管理
- JWT 安全認證

### 多風格主題系統

系統內建 6 種精心設計的視覺風格，可在後台一鍵切換：

| 風格 | ID | 特色 |
|------|-----|------|
| 經典優雅 | `classic` | 米白色調、Playfair Display 襯線字體、毛玻璃導航、柔和陰影 |
| 現代極簡 | `minimal` | 純黑白配色、大量留白、無圓角設計、優雅的淡入動畫 |
| 創意大膽 | `creative` | 橘紅強調色、傾斜標題、彩色陰影、動感的滑入效果 |
| 日系清新 | `japanese` | 奶油白底、柔粉色調、Noto Sans TC 細體、緩慢淡入 |
| 科技未來 | `tech` | 深黑背景、霓虹綠發光效果、JetBrains Mono 等寬字體 |
| 野獸派 | `brutal` | 高對比黑白、粗獷排版、Glitch 故障藝術動態標題 |

**切換方式：** 登入後台 → 網站設定 → 選擇主題 → 儲存

每種風格都包含完整的配色、字體、圓角、陰影、動畫等設定，並自動適配 RWD 響應式設計。

## 技術棧

| 類別 | 技術 |
|------|------|
| 框架 | Nuxt 4 (Vue 3 + TypeScript) |
| UI | Tailwind CSS 4 + @nuxt/ui |
| 資料庫 | MongoDB |
| 物件儲存 | MinIO（圖片上傳） |
| 認證 | JWT + httpOnly Cookie |
| 部署 | Zeabur |

## 快速開始

### 一鍵部署到 Zeabur

[![Deploy on Zeabur](https://zeabur.com/button.svg)](https://zeabur.com/templates)

詳細部署教學請參考：[Zeabur 部署指南](./docs/zeabur-deploy.md)

### 本地開發

1. **複製專案**
   ```bash
   git clone https://github.com/your-username/designer-portfolio.git
   cd designer-portfolio
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **設定環境變數**
   ```bash
   cp .env.example .env
   ```
   編輯 `.env` 檔案，填入你的 MongoDB 連線資訊和 JWT 密鑰。

4. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

   開啟 http://localhost:3000 查看前台
   開啟 http://localhost:3000/admin 進入後台

### 預設管理員帳號

首次啟動時，系統會自動建立預設管理員帳號：

| 帳號 | 密碼 |
|------|------|
| admin | Admin123456 |

> 請在首次登入後立即修改密碼！

## 環境變數

| 變數名稱 | 必填 | 說明 | 範例 |
|---------|------|------|------|
| `MONGO_URI` | 是 | MongoDB 連接字串 | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | 是 | JWT 加密密鑰（至少 32 字元） | `your-super-secret-key-at-least-32-chars` |
| `COOKIE_SECURE` | 否 | Cookie 安全設定 | `true`（生產環境）/ `false`（本地開發） |
| `MINIO_ENDPOINT` | 是 | MinIO 伺服器位址 | `xxx.clusters.zeabur.com` |
| `MINIO_ACCESS_KEY` | 是 | MinIO 存取金鑰 | `your_access_key` |
| `MINIO_SECRET_KEY` | 是 | MinIO 秘密金鑰 | `your_secret_key` |
| `MINIO_BUCKET_NAME` | 是 | Bucket 名稱 | `portfolio` |
| `MINIO_USE_SSL` | 否 | 是否使用 HTTPS | `true`（生產環境）/ `false`（本地開發） |

詳細環境變數設定請參考：[環境變數設定指南](./docs/zeabur-deploy.md#步驟六環境變數設定)

## 專案結構

```
├── app/
│   ├── components/       # Vue 元件
│   │   ├── admin/        # 後台專用元件
│   │   └── front/        # 前台元件
│   │       └── themes/   # 主題組件（6 種風格）
│   ├── composables/      # 組合式函數
│   │   └── admin/        # 後台專用 composables
│   ├── pages/            # 頁面路由
│   │   ├── admin/        # 後台頁面
│   │   └── work/         # 作品詳情頁
│   └── types/            # TypeScript 型別定義
├── server/
│   ├── api/              # API 路由
│   │   ├── admin/        # 後台 API（需認證）
│   │   └── public/       # 公開 API
│   ├── middleware/       # 伺服器中介軟體
│   ├── plugins/          # Nitro 插件
│   └── utils/            # 工具函數
├── docs/                 # 文件
└── public/               # 靜態資源
```

## 常用指令

```bash
# 開發
npm run dev              # 啟動開發伺服器

# 建置
npm run build            # 建置生產版本（SSR）
npm run generate         # 生成靜態網站

# 資料庫
npm run seed:admin       # 建立/更新管理員帳號（互動式）
npm run reset-password   # 重置 admin 密碼為預設值
```

## 文件

- [Zeabur 部署指南](./docs/zeabur-deploy.md) - 完整的部署教學
- [CLAUDE.md](./CLAUDE.md) - 開發者技術文件


## 免責聲明

本專案以「現狀」（AS IS）提供，不附帶任何明示或暗示的保證。

- 作者**不對使用本專案所造成的任何直接或間接損害負責**，包括但不限於：資料遺失、服務中斷、安全漏洞、商業損失等。
- 使用者應自行承擔使用本專案的所有風險。
- 本專案僅供學習和參考用途，若用於生產環境，請自行評估並做好安全措施。
- 作者不保證本專案的功能完整性、穩定性或適用於任何特定用途。
- 使用本專案即表示您同意本免責聲明的所有條款。

**簡單來說**：歡迎自由使用，但出了任何問題請自行負責。

---

## 授權

MIT License