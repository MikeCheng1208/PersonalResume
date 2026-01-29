<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useAdminAuth } from "~/composables/admin/useAdminAuth";
import { useAdminAPI } from "~/composables/admin/useAdminAPI";
import AdminLayout from "~/components/admin/AdminLayout.vue";
import ImageCropUpload from "~/components/admin/ImageCropUpload.vue";

definePageMeta({
  middleware: "admin-auth",
});

const { hasPermission } = useAdminAuth();
const toast = useToast();
const api = useAdminAPI();

// 檢查權限（使用 profile:write 權限，因為網站設定與個人資料相關）
if (!hasPermission("profile:write")) {
  navigateTo("/admin/dashboard");
}

// 狀態管理
const isLoading = ref(false);
const isSaving = ref(false);
const settings = ref<any>(null);

// 表單狀態
const formState = reactive({
  siteName: "",
  siteTitle: "",
  siteDescription: "",
  siteAuthor: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
});

/**
 * 載入網站設定
 */
const loadSettings = async () => {
  isLoading.value = true;

  try {
    const response = await api.get("/api/admin/site-settings");
    settings.value = response.settings;

    // 填充表單
    formState.siteName = response.settings.siteName || "";
    formState.siteTitle = response.settings.siteTitle || "";
    formState.siteDescription = response.settings.siteDescription || "";
    formState.siteAuthor = response.settings.siteAuthor || "";
    formState.ogTitle = response.settings.ogTitle || "";
    formState.ogDescription = response.settings.ogDescription || "";
    formState.ogImage = response.settings.ogImage || "";
  } catch (error: any) {
    console.error("載入網站設定失敗:", error);
    // 如果是 404，代表尚未有設定，這是正常的
    if (error.statusCode !== 404) {
      toast.add({
        title: "載入失敗",
        description: "無法載入網站設定",
        color: "error",
        icon: "i-heroicons-x-circle",
      });
    }
  } finally {
    isLoading.value = false;
  }
};

/**
 * 提交表單
 */
const handleSubmit = async () => {
  // 驗證必填欄位
  if (!formState.siteName.trim()) {
    toast.add({
      title: "驗證失敗",
      description: "請輸入網站名稱",
      color: "error",
    });
    return;
  }

  if (!formState.siteTitle.trim()) {
    toast.add({
      title: "驗證失敗",
      description: "請輸入網站標題",
      color: "error",
    });
    return;
  }

  isSaving.value = true;

  try {
    const response = await api.put(
      "/api/admin/site-settings",
      {
        siteName: formState.siteName.trim(),
        siteTitle: formState.siteTitle.trim(),
        siteDescription: formState.siteDescription.trim(),
        siteAuthor: formState.siteAuthor.trim(),
        ogTitle: formState.ogTitle.trim() || formState.siteTitle.trim(),
        ogDescription:
          formState.ogDescription.trim() || formState.siteDescription.trim(),
        ogImage: formState.ogImage.trim() || undefined,
      },
      {
        showSuccessToast: true,
        successMessage: "網站設定更新成功，前台將自動同步更新",
      }
    );

    // 更新本地資料
    settings.value = response.settings;
  } catch (error) {
    console.error("更新網站設定失敗:", error);
  } finally {
    isSaving.value = false;
  }
};

/**
 * 預覽變更
 */
const previewChanges = () => {
  window.open("/", "_blank");
};

/**
 * 自動填入 OG 欄位
 */
const autoFillOg = () => {
  if (!formState.ogTitle) {
    formState.ogTitle = formState.siteTitle;
  }
  if (!formState.ogDescription) {
    formState.ogDescription = formState.siteDescription;
  }
};

// 初始載入
onMounted(() => {
  loadSettings();
});
</script>

<template>
  <AdminLayout
    page-title="網站設定"
    page-description="管理網站名稱、SEO 設定和社群分享資訊"
  >
    <!-- Loading State -->
    <div v-if="isLoading && !settings" class="loading-container">
      <div class="loading-content">
        <UIcon name="i-heroicons-arrow-path" class="loading-icon" />
        <p class="loading-text">載入中...</p>
      </div>
    </div>

    <!-- Settings Form -->
    <div v-else class="settings-form">
      <form @submit.prevent="handleSubmit" class="form-container">
        <!-- 基本設定 -->
        <div class="form-section">
          <div class="section-header">
            <div>
              <h3 class="section-title">基本設定</h3>
              <p class="section-description">
                網站的基本資訊，將顯示在導航列、頁尾等位置
              </p>
            </div>
          </div>

          <div class="form-grid">
            <!-- 網站名稱 -->
            <div class="form-field">
              <label class="field-label">
                網站名稱
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.siteName"
                type="text"
                class="field-input"
                placeholder="例如：王小明"
                :disabled="isSaving"
                required
              />
              <p class="field-hint">顯示在導航列 Logo 和頁尾等位置</p>
            </div>

            <!-- 網站作者 -->
            <div class="form-field">
              <label class="field-label">網站作者</label>
              <input
                v-model="formState.siteAuthor"
                type="text"
                class="field-input"
                placeholder="例如：王小明"
                :disabled="isSaving"
              />
              <p class="field-hint">用於 HTML meta author 標籤</p>
            </div>

            <!-- 網站標題 -->
            <div class="form-field full-width">
              <label class="field-label">
                網站標題
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.siteTitle"
                type="text"
                class="field-input"
                placeholder="例如：王小明 - UI/UX 設計師"
                :disabled="isSaving"
                required
              />
              <p class="field-hint">顯示在瀏覽器分頁標題</p>
            </div>

            <!-- 網站描述 -->
            <div class="form-field full-width">
              <label class="field-label">網站描述</label>
              <textarea
                v-model="formState.siteDescription"
                class="field-textarea"
                placeholder="簡短描述您的網站，將用於搜尋引擎結果顯示"
                rows="3"
                :disabled="isSaving"
              ></textarea>
              <p class="field-hint">
                用於 SEO，建議 150-160 字元內，會顯示在 Google 搜尋結果
              </p>
            </div>
          </div>
        </div>

        <!-- Open Graph 設定 -->
        <div class="form-section">
          <div class="section-header">
            <div>
              <h3 class="section-title">社群分享設定</h3>
              <p class="section-description">
                當網站被分享到 Facebook、LINE、Twitter
                等社群平台時顯示的資訊
              </p>
            </div>
            <button
              type="button"
              class="auto-fill-button"
              @click="autoFillOg"
              :disabled="isSaving"
            >
              <UIcon name="i-heroicons-sparkles" />
              自動填入
            </button>
          </div>

          <div class="og-preview">
            <div class="og-preview-card">
              <div
                class="og-preview-image"
                :style="{
                  backgroundImage: formState.ogImage
                    ? `url(${formState.ogImage})`
                    : 'none',
                }"
              >
                <UIcon
                  v-if="!formState.ogImage"
                  name="i-heroicons-photo"
                  class="og-preview-placeholder"
                />
              </div>
              <div class="og-preview-content">
                <p class="og-preview-title">
                  {{ formState.ogTitle || formState.siteTitle || "網站標題" }}
                </p>
                <p class="og-preview-description">
                  {{
                    formState.ogDescription ||
                    formState.siteDescription ||
                    "網站描述..."
                  }}
                </p>
                <p class="og-preview-url">yourdomain.com</p>
              </div>
            </div>
            <p class="og-preview-label">社群分享預覽</p>
          </div>

          <div class="form-grid">
            <!-- OG 標題 -->
            <div class="form-field full-width">
              <label class="field-label">分享標題</label>
              <input
                v-model="formState.ogTitle"
                type="text"
                class="field-input"
                :placeholder="formState.siteTitle || '留空將使用網站標題'"
                :disabled="isSaving"
              />
              <p class="field-hint">留空將自動使用網站標題</p>
            </div>

            <!-- OG 描述 -->
            <div class="form-field full-width">
              <label class="field-label">分享描述</label>
              <textarea
                v-model="formState.ogDescription"
                class="field-textarea"
                :placeholder="formState.siteDescription || '留空將使用網站描述'"
                rows="2"
                :disabled="isSaving"
              ></textarea>
              <p class="field-hint">留空將自動使用網站描述</p>
            </div>

            <!-- OG 圖片 -->
            <div class="form-field full-width">
              <label class="field-label">分享圖片</label>
              <div class="og-image-upload-wrapper">
                <div class="og-image-upload-container">
                  <ImageCropUpload
                    v-model="formState.ogImage"
                    folder="og"
                    placeholder="點擊上傳分享圖片"
                    help="支援 JPG、PNG、WebP，最大 10MB"
                    :aspect-ratio="1200 / 630"
                    cropper-title="裁切分享圖片"
                    preview-class="og-image-preview"
                  />
                </div>
                <div class="og-image-info">
                  <div class="og-image-info-card">
                    <UIcon name="i-heroicons-information-circle" class="info-icon-small" />
                    <div class="og-image-info-content">
                      <p class="og-image-info-title">建議圖片尺寸</p>
                      <p class="og-image-info-size">1200 x 630 像素</p>
                      <p class="og-image-info-ratio">比例 1.91:1（橫向）</p>
                    </div>
                  </div>
                  <p class="og-image-info-desc">
                    此圖片將在 Facebook、LINE、Twitter 等社群平台分享時顯示為縮圖
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 說明卡片 -->
        <div class="info-card">
          <div class="info-icon">
            <UIcon name="i-heroicons-light-bulb" />
          </div>
          <div class="info-content">
            <h4 class="info-title">關於網站設定</h4>
            <ul class="info-list">
              <li>
                <strong>網站名稱</strong>：會顯示在導航列、作品頁的
                Logo、以及頁尾版權聲明
              </li>
              <li>
                <strong>網站標題</strong>：用於瀏覽器分頁標題和 SEO
              </li>
              <li>
                <strong>社群分享設定</strong>：當您的網站被分享到
                Facebook、LINE 等平台時顯示的資訊
              </li>
              <li>儲存後，前台網站會自動同步更新，無需重新部署</li>
            </ul>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <div class="actions-left">
            <button
              type="button"
              class="button button-secondary"
              @click="loadSettings"
              :disabled="isSaving"
            >
              <UIcon name="i-heroicons-arrow-path" />
              重置
            </button>
          </div>

          <div class="actions-right">
            <button
              type="button"
              class="button button-ghost"
              @click="previewChanges"
              :disabled="isSaving"
            >
              <UIcon name="i-heroicons-eye" />
              預覽網站
            </button>
            <button
              type="submit"
              class="button button-primary"
              :disabled="isSaving"
            >
              <UIcon
                v-if="isSaving"
                name="i-heroicons-arrow-path"
                class="animate-spin"
              />
              <UIcon v-else name="i-heroicons-check" />
              {{ isSaving ? "儲存中..." : "儲存設定" }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </AdminLayout>
</template>

<style scoped>
/* Loading */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6rem 0;
}

.loading-content {
  text-align: center;
}

.loading-icon {
  width: 48px;
  height: 48px;
  color: #3b82f6;
  margin: 0 auto 1rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

/* Form Container */
.settings-form {
  max-width: 900px;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Form Section */
.form-section {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.form-section:hover {
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.02em;
}

.section-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

/* Auto Fill Button */
.auto-fill-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f0fdf4;
  color: #16a34a;
  border: 2px solid #bbf7d0;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.auto-fill-button:hover:not(:disabled) {
  background: #dcfce7;
  border-color: #86efac;
}

.auto-fill-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

/* Form Field */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.required {
  color: #ef4444;
}

.field-input,
.field-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.9375rem;
  color: #0f172a;
  background: white;
  transition: all 0.3s;
}

.field-input:focus,
.field-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-input:disabled,
.field-textarea:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.field-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  line-height: 1.6;
}

.field-hint {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
}

/* OG Preview */
.og-preview {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.og-preview-card {
  width: 100%;
  max-width: 500px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.og-preview-image {
  width: 100%;
  height: 200px;
  background-color: #f1f5f9;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.og-preview-placeholder {
  width: 48px;
  height: 48px;
  color: #cbd5e1;
}

.og-preview-content {
  padding: 1rem;
}

.og-preview-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.og-preview-description {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.og-preview-url {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
  text-transform: uppercase;
}

.og-preview-label {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 1rem 0 0 0;
  text-align: center;
}

/* OG Image Upload */
.og-image-upload-wrapper {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.og-image-upload-container {
  flex: 1;
  max-width: 400px;
}

.og-image-upload-container :deep(.upload-preview) {
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  overflow: hidden;
}

.og-image-upload-container :deep(.og-image-preview) {
  width: 100%;
  height: auto;
  aspect-ratio: 1200 / 630;
  object-fit: cover;
}

.og-image-upload-container :deep(.upload-dropzone) {
  aspect-ratio: 1200 / 630;
  border-radius: 12px;
  min-height: 160px;
}

.og-image-info {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.5rem;
}

.og-image-info-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 12px;
}

.info-icon-small {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: #0284c7;
  margin-top: 2px;
}

.og-image-info-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.og-image-info-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #0c4a6e;
  margin: 0;
}

.og-image-info-size {
  font-size: 1.125rem;
  font-weight: 700;
  color: #0369a1;
  margin: 0;
  font-family: ui-monospace, monospace;
}

.og-image-info-ratio {
  font-size: 0.75rem;
  color: #0284c7;
  margin: 0;
}

.og-image-info-desc {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
  max-width: 200px;
}

/* Info Card */
.info-card {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
  border-radius: 16px;
  border: 1px solid #ddd6fe;
}

.info-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  color: #8b5cf6;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
}

.info-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.info-content {
  flex: 1;
}

.info-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1e1b4b;
  margin: 0 0 0.75rem 0;
}

.info-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-list li {
  font-size: 0.875rem;
  color: #4c1d95;
  line-height: 1.5;
  padding-left: 1.25rem;
  position: relative;
}

.info-list li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.5em;
  width: 6px;
  height: 6px;
  background: #8b5cf6;
  border-radius: 50%;
}

.info-list li strong {
  color: #1e1b4b;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: white;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  gap: 1rem;
}

.actions-left,
.actions-right {
  display: flex;
  gap: 0.75rem;
}

/* Buttons */
.button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.button-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px -2px rgba(59, 130, 246, 0.3);
}

.button-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px -4px rgba(59, 130, 246, 0.4);
}

.button-primary:active:not(:disabled) {
  transform: translateY(0);
}

.button-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 2px solid #e2e8f0;
}

.button-secondary:hover:not(:disabled) {
  background: #e2e8f0;
  border-color: #cbd5e1;
}

.button-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-ghost {
  background: transparent;
  color: #64748b;
  border: 2px solid transparent;
}

.button-ghost:hover:not(:disabled) {
  background: #f8fafc;
  color: #334155;
  border-color: #e2e8f0;
}

.button-ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .form-section {
    padding: 1.5rem;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
  }

  .auto-fill-button {
    width: 100%;
    justify-content: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field.full-width {
    grid-column: 1;
  }

  .og-preview-image {
    height: 150px;
  }

  .og-image-upload-wrapper {
    flex-direction: column;
    gap: 1.5rem;
  }

  .og-image-upload-container {
    max-width: 100%;
  }

  .og-image-info {
    width: 100%;
  }

  .og-image-info-desc {
    max-width: 100%;
  }

  .info-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-actions {
    flex-direction: column;
    padding: 1rem;
  }

  .actions-left,
  .actions-right {
    width: 100%;
    flex-direction: column;
  }

  .button {
    width: 100%;
    justify-content: center;
  }
}
</style>
