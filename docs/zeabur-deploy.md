# Zeabur 部署指南

這份指南將帶你一步步將作品集網站部署到 Zeabur。

## 目錄

- [前置準備](#前置準備)
- [步驟一：建立 Zeabur 帳號](#步驟一建立-zeabur-帳號)
- [步驟二：建立專案](#步驟二建立專案)
- [步驟三：部署 MongoDB 資料庫](#步驟三部署-mongodb-資料庫)
- [步驟四：部署 MinIO 物件儲存](#步驟四部署-minio-物件儲存)
- [步驟五：部署網站服務](#步驟五部署網站服務)
- [步驟六：環境變數設定](#步驟六環境變數設定)
- [步驟七：綁定網域](#步驟七綁定網域)
- [常見問題](#常見問題)

---

## 前置準備

在開始之前，請確認你已經準備好：

- [ ] GitHub 帳號（用於連結 Zeabur）
- [ ] 已將專案 Fork 或 Push 到你的 GitHub Repository
- [ ] 信用卡或金融卡（Zeabur 需要綁定付款方式，但有免費額度）

---

## 步驟一：建立 Zeabur 帳號

1. 前往 [Zeabur 官網](https://zeabur.com)
2. 點擊右上角的「Sign In」
3. 選擇「Continue with GitHub」使用 GitHub 帳號登入
4. 授權 Zeabur 存取你的 GitHub

---

## 步驟二：建立專案

1. 登入後，點擊「Create Project」建立新專案
2. 輸入專案名稱（例如：`my-portfolio`）
3. 選擇部署區域：
   - **Asia - Taiwan** - 台灣（推薦，速度最快）
   - **Asia - Tokyo** - 日本
   - **US - West** - 美國西岸

---

## 步驟三：部署 MongoDB 資料庫

網站需要 MongoDB 資料庫來儲存資料。Zeabur 提供一鍵建立 MongoDB 的功能。

1. 在專案頁面，點擊「Add Service」
2. 選擇「Marketplace」分頁
3. 搜尋並選擇「MongoDB」
4. 點擊「Deploy」開始部署

部署完成後，你會看到 MongoDB 服務出現在專案中。

### 取得 MongoDB 連接字串

1. 點擊 MongoDB 服務卡片
2. 切換到「Connect」分頁
3. 複製「Connection String」，格式如下：
   ```
   mongodb://root:xxxxxxxx@xxx.clusters.zeabur.com:12345
   ```
4. **重要**：在連接字串最後加上資料庫名稱，例如：
   ```
   mongodb://root:xxxxxxxx@xxx.clusters.zeabur.com:12345/portfolio
   ```

> 請保存這個連接字串，稍後設定環境變數時會用到。

---

## 步驟四：部署 MinIO 物件儲存

網站需要 MinIO 來儲存上傳的圖片（作品封面、個人照片等）。

1. 在專案頁面，點擊「Add Service」
2. 選擇「Marketplace」分頁
3. 搜尋並選擇「MinIO」
4. 點擊「Deploy」開始部署

部署完成後，你會看到 MinIO 服務出現在專案中。

### 取得 MinIO 連接資訊

1. 點擊 MinIO 服務卡片
2. 切換到「Connect」分頁
3. 記下以下資訊：

| 項目 | 說明 |
|------|------|
| **Endpoint** | MinIO 伺服器位址（例如：`xxx.clusters.zeabur.com`） |
| **Access Key** | 存取金鑰（通常是 `root` 或自動產生的值） |
| **Secret Key** | 秘密金鑰 |

> 請保存這些資訊，稍後設定環境變數時會用到。

### 設定 Bucket 名稱

你可以自訂 Bucket 名稱，建議使用：
- `portfolio` - 簡單易記
- `your-name-portfolio` - 如果你有多個專案

> Bucket 會在首次上傳圖片時自動建立，並自動設定公開讀取權限。

---

## 步驟五：部署網站服務

1. 在專案頁面，點擊「Add Service」
2. 選擇「Git」分頁
3. 找到並選擇你的 Portfolio Repository
4. Zeabur 會自動偵測專案類型（Nuxt.js）
5. 點擊「Deploy」開始部署

> 首次部署可能需要 2-5 分鐘，請耐心等待。

---

## 步驟六：環境變數設定

這是最重要的步驟！網站需要正確的環境變數才能運作。

1. 點擊你的網站服務卡片
2. 切換到「Variables」分頁
3. 點擊「Add Variable」新增以下環境變數：

### 必填環境變數

| 變數名稱 | 值 | 說明 |
|---------|-----|------|
| `MONGO_URI` | `mongodb://root:xxx@xxx.zeabur.com:12345/portfolio` | MongoDB 連接字串（步驟三取得的，記得加上資料庫名稱） |
| `JWT_SECRET` | `your-super-secret-key-min-32-characters` | JWT 加密密鑰，請自行設定一個至少 32 個字元的隨機字串 |
| `COOKIE_SECURE` | `true` | 生產環境必須設為 `true` |
| `MINIO_ENDPOINT` | `xxx.clusters.zeabur.com` | MinIO 伺服器位址（步驟四取得，不含 `https://`） |
| `MINIO_ACCESS_KEY` | `your_access_key` | MinIO 存取金鑰 |
| `MINIO_SECRET_KEY` | `your_secret_key` | MinIO 秘密金鑰 |
| `MINIO_BUCKET_NAME` | `portfolio` | Bucket 名稱（自訂） |
| `MINIO_USE_SSL` | `true` | 使用 HTTPS（Zeabur 上必須為 `true`） |

### 如何設定

**MONGO_URI**
```
mongodb://root:xxxxxxxx@xxx.clusters.zeabur.com:12345/portfolio
```
- 從 MongoDB 服務的 Connect 頁面複製
- 在最後加上 `/portfolio`（或你想要的資料庫名稱）

**JWT_SECRET**
```
請自行產生一個安全的隨機字串，例如：
aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789!@#
```
- 至少 32 個字元
- 包含大小寫字母、數字
- 可以加入特殊符號
- **請勿使用範例中的值！**

> 提示：你可以使用 [Random String Generator](https://www.random.org/strings/) 產生隨機字串

**COOKIE_SECURE**
```
true
```
- 生產環境固定設為 `true`
- 這會啟用 HTTPS-only Cookie，提升安全性

**MINIO_ENDPOINT**
```
xxx.clusters.zeabur.com
```
- 從 MinIO 服務的 Connect 頁面取得
- **注意**：不要加上 `https://`，只需要域名部分

**MINIO_ACCESS_KEY 和 MINIO_SECRET_KEY**
- 從 MinIO 服務的 Connect 頁面取得
- 通常 Access Key 是 `root`，Secret Key 是自動產生的

**MINIO_BUCKET_NAME**
```
portfolio
```
- 自訂名稱，建議使用小寫字母和連字號
- Bucket 會在首次上傳時自動建立

**MINIO_USE_SSL**
```
true
```
- Zeabur 上固定設為 `true`（使用 HTTPS）
- 本地開發時設為 `false`

### 設定完成後

1. 點擊「Save」儲存環境變數
2. 服務會自動重新部署
3. 等待部署完成（約 1-2 分鐘）

---

## 步驟七：綁定網域

### 使用 Zeabur 免費網域

1. 點擊網站服務卡片
2. 切換到「Networking」分頁
3. 點擊「Generate Domain」
4. 你會得到一個免費網域，格式如：`your-project.zeabur.app`

### 使用自訂網域（選用）

如果你有自己的網域：

1. 在「Networking」分頁，點擊「Add Domain」
2. 輸入你的網域（例如：`portfolio.example.com`）
3. 按照指示在你的 DNS 服務商設定 CNAME 記錄：
   - 類型：`CNAME`
   - 名稱：`portfolio`（或你的子網域）
   - 值：`cname.zeabur.com`
4. 等待 DNS 生效（通常 5-30 分鐘）

---

## 部署完成！

恭喜！你的作品集網站已經上線了！

### 存取網站

- **前台**：`https://your-domain.zeabur.app`
- **後台**：`https://your-domain.zeabur.app/admin`

### 預設管理員帳號

首次部署後，系統會自動建立預設管理員帳號：

| 帳號 | 密碼 |
|------|------|
| admin | Admin123456 |

> **安全提醒**：請立即登入後台並修改密碼！

---

## 常見問題

### Q: 網站顯示錯誤或無法連接資料庫？

**A:** 請檢查環境變數設定：

1. 確認 `MONGO_URI` 格式正確
2. 確認連接字串最後有加上資料庫名稱（如 `/portfolio`）
3. 確認 MongoDB 服務正在運行
4. 重新部署服務

### Q: 登入後台時顯示錯誤？

**A:** 請檢查：

1. `JWT_SECRET` 是否已設定且至少 32 個字元
2. `COOKIE_SECURE` 是否設為 `true`
3. 是否使用 HTTPS 存取網站

### Q: 如何重置管理員密碼？

**A:** 你需要連接到 MongoDB 資料庫：

1. 在 Zeabur 的 MongoDB 服務中，使用 Connect 功能
2. 或者刪除 `admin_users` collection 中的資料
3. 重新部署網站服務，系統會自動建立預設帳號

### Q: 部署失敗怎麼辦？

**A:** 請檢查：

1. 查看 Zeabur 的 Deployment Logs 找出錯誤原因
2. 確認所有環境變數都已正確設定
3. 確認 GitHub Repository 的程式碼沒有語法錯誤

### Q: 如何更新網站？

**A:** 只需要 Push 新的程式碼到 GitHub：

1. 修改程式碼
2. `git push` 到 GitHub
3. Zeabur 會自動偵測變更並重新部署

### Q: 圖片上傳失敗或無法顯示？

**A:** 請檢查 MinIO 設定：

1. 確認所有 MinIO 環境變數都已設定
2. 確認 `MINIO_ENDPOINT` 不包含 `https://`
3. 確認 `MINIO_USE_SSL` 設為 `true`
4. 確認 MinIO 服務正在運行
5. 查看 Deployment Logs 是否有 MinIO 相關錯誤

### Q: 圖片上傳成功但無法公開存取？

**A:** 這通常是 Bucket 權限問題：

1. 系統會自動設定公開讀取權限
2. 如果仍有問題，可以在後台呼叫 `/api/admin/upload/fix-policy` API 重新設定權限
3. 或者重新部署網站服務

---

## 費用說明

Zeabur 的計費方式：

- **免費額度**：每月有一定的免費使用額度
- **計費方式**：超過免費額度後，按使用量計費
- **MongoDB**：內建的 MongoDB 服務包含在計費中
- **MinIO**：內建的 MinIO 服務包含在計費中（依儲存空間和流量計費）

建議先使用免費額度測試，確認一切正常後再考慮是否升級方案。

詳細價格請參考：[Zeabur Pricing](https://zeabur.com/pricing)

---

## 需要幫助？

- [Zeabur 官方文件](https://zeabur.com/docs)
- [Zeabur Discord 社群](https://discord.gg/zeabur)

---

祝你部署順利！
