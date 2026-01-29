export default defineNuxtPlugin(() => {
  // 這個 plugin 只在客戶端執行
  // 新策略：不使用 opacity 隱藏，而是透過 critical CSS 確保基本樣式
  // 此 plugin 保留用於未來可能需要的客戶端初始化邏輯
})
