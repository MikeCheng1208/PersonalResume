# 李松年 - UI/UX 設計師作品集

這是一個使用 Nuxt 4 建立的個人作品集網站,展現極簡優雅的設計風格。

## 設計特色

- **極簡美學**: 大膽的留白和精準的排版
- **流暢動畫**: 細膩的微互動效果,提升使用者體驗
- **完整 RWD**: 7 個響應式斷點,完美適配桌機、平板、手機
- **SSR 支援**: 支援伺服器端渲染,優化 SEO 和效能
- **靜態生成**: 可生成靜態網站進行部署

## 技術棧

- **框架**: Nuxt 4
- **UI 框架**: Vue 3
- **語言**: TypeScript
- **樣式**: CSS (Scoped Styles)

## 快速開始

### 安裝依賴

```bash
npm install
```

### 開發伺服器

啟動開發伺服器於 http://localhost:3000

```bash
npm run dev
```

### 建置生產版本

```bash
# SSR 建置
npm run build

# 靜態網站生成
npm run generate
```

### 預覽生產版本

```bash
npm run preview
```

## 專案結構

```
PersonalResume/
├── app/
│   ├── app.vue          # 應用程式根組件
│   └── pages/
│       └── index.vue    # 首頁
├── public/              # 靜態資源
├── nuxt.config.ts       # Nuxt 配置
└── package.json         # 專案依賴
```

## 自訂內容

### 修改個人資訊

編輯 `app/pages/index.vue` 中的資料:

```typescript
const projects = [
  // 修改專案資訊
]
```

### 添加個人照片

1. 將照片放入 `public/` 資料夾(建議命名為 `profile.jpg`)
2. 編輯 `app/pages/index.vue`,將佔位符替換為:
   ```vue
   <div class="profile-photo__image">
     <img src="/profile.jpg" alt="李松年" />
   </div>
   ```

詳細說明請參考: [HOW-TO-ADD-PHOTO.md](./HOW-TO-ADD-PHOTO.md)

### 調整設計風格

全域樣式變數定義在 `app/app.vue`:

```css
:root {
  --color-bg: #fafaf9;
  --color-text: #1a1a1a;
  --color-accent: #1e40af;
  /* ... */
}
```

## 部署

### 靜態網站部署

1. 生成靜態檔案:
   ```bash
   npm run generate
   ```

2. 部署 `.output/public` 目錄到以下平台:
   - Netlify
   - Vercel
   - GitHub Pages
   - Cloudflare Pages

### SSR 部署

使用 `npm run build` 建置後,可部署到:
- Vercel
- Netlify
- Railway
- 任何支援 Node.js 的平台

## 授權

© 2026 李松年. All rights reserved.
