<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAdminAuth } from '~/composables/admin/useAdminAuth'
import { useAdminAPI } from '~/composables/admin/useAdminAPI'
import AdminLayout from '~/components/admin/AdminLayout.vue'
import ImageCropUpload from '~/components/admin/ImageCropUpload.vue'

definePageMeta({
  middleware: 'admin-auth'
})

const { hasPermission } = useAdminAuth()
const toast = useToast()
const api = useAdminAPI()

// 檢查權限
if (!hasPermission('profile:write')) {
  navigateTo('/admin/dashboard')
}

// 狀態管理
const isLoading = ref(false)
const isSaving = ref(false)
const profile = ref<any>(null)
const photoUploadRef = ref<any>(null)

// 表單狀態
const formState = reactive({
  name: '',
  nameEn: '',
  title: '',
  bio: [''],
  philosophy: '',
  photo: ''
})

/**
 * 載入 Profile 資料
 */
const loadProfile = async () => {
  isLoading.value = true

  try {
    const response = await api.get('/api/admin/profile')
    profile.value = response.profile

    // 填充表單
    formState.name = response.profile.name
    formState.nameEn = response.profile.nameEn
    formState.title = response.profile.title
    formState.bio = [...response.profile.bio]
    formState.philosophy = response.profile.philosophy
    formState.photo = response.profile.photo || ''
  } catch (error) {
    console.error('載入 Profile 失敗:', error)
    toast.add({
      title: '載入失敗',
      description: '無法載入個人資料',
      color: 'error',
      icon: 'i-heroicons-x-circle'
    })
  } finally {
    isLoading.value = false
  }
}

/**
 * 新增簡介段落
 */
const addBioLine = () => {
  formState.bio.push('')
}

/**
 * 移除簡介段落
 */
const removeBioLine = (index: number) => {
  formState.bio.splice(index, 1)
}

/**
 * 提交表單
 */
const handleSubmit = async () => {
  // 驗證
  if (!formState.name.trim()) {
    toast.add({
      title: '驗證失敗',
      description: '請輸入中文姓名',
      color: 'error'
    })
    return
  }

  if (!formState.nameEn.trim()) {
    toast.add({
      title: '驗證失敗',
      description: '請輸入英文姓名',
      color: 'error'
    })
    return
  }

  if (!formState.title.trim()) {
    toast.add({
      title: '驗證失敗',
      description: '請輸入職稱',
      color: 'error'
    })
    return
  }

  if (formState.bio.every(line => !line.trim())) {
    toast.add({
      title: '驗證失敗',
      description: '請至少輸入一段個人簡介',
      color: 'error'
    })
    return
  }

  if (!formState.philosophy.trim()) {
    toast.add({
      title: '驗證失敗',
      description: '請輸入設計理念',
      color: 'error'
    })
    return
  }

  isSaving.value = true

  try {
    // 過濾空白的 bio 段落
    const cleanedBio = formState.bio.filter(line => line.trim())

    const response = await api.put(
      '/api/admin/profile',
      {
        name: formState.name.trim(),
        nameEn: formState.nameEn.trim(),
        title: formState.title.trim(),
        bio: cleanedBio,
        philosophy: formState.philosophy.trim(),
        photo: formState.photo.trim() || undefined
      },
      {
        showSuccessToast: true,
        successMessage: '個人資料更新成功'
      }
    )

    // 更新本地資料
    profile.value = response.profile
  } catch (error) {
    console.error('更新 Profile 失敗:', error)
  } finally {
    isSaving.value = false
  }
}

/**
 * 預覽變更
 */
const previewChanges = () => {
  // 在新分頁開啟前台網站
  window.open('/', '_blank')
}

/**
 * 觸發照片更換
 */
const triggerPhotoChange = () => {
  photoUploadRef.value?.triggerFileSelect()
}

/**
 * 移除照片
 */
const removePhoto = () => {
  photoUploadRef.value?.handleRemove()
}

// 初始載入
onMounted(() => {
  loadProfile()
})
</script>

<template>
  <AdminLayout page-title="個人資料管理" page-description="編輯網站上顯示的個人資訊">
    <!-- Loading State -->
    <div v-if="isLoading && !profile" class="loading-container">
      <div class="loading-content">
        <UIcon name="i-heroicons-arrow-path" class="loading-icon" />
        <p class="loading-text">載入中...</p>
      </div>
    </div>

    <!-- Profile Form -->
    <div v-else class="profile-form">
      <form @submit.prevent="handleSubmit" class="form-container">
        <!-- 基本資訊 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">基本資訊</h3>
            <p class="section-description">網站上顯示的個人基本資訊</p>
          </div>

          <div class="form-grid">
            <!-- 中文姓名 -->
            <div class="form-field">
              <label class="field-label">
                中文姓名
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.name"
                type="text"
                class="field-input"
                placeholder="請輸入中文姓名"
                :disabled="isSaving"
                required
              />
            </div>

            <!-- 英文姓名 -->
            <div class="form-field">
              <label class="field-label">
                英文姓名
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.nameEn"
                type="text"
                class="field-input"
                placeholder="請輸入英文姓名"
                :disabled="isSaving"
                required
              />
            </div>

            <!-- 職稱 -->
            <div class="form-field full-width">
              <label class="field-label">
                職稱
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.title"
                type="text"
                class="field-input"
                placeholder="例如: UI/UX 設計師"
                :disabled="isSaving"
                required
              />
            </div>

            </div>
        </div>

        <!-- 個人照片 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">個人照片</h3>
            <p class="section-description">上傳您的個人照片，將自動裁切為 1:1 正方形</p>
          </div>

          <div class="photo-upload-wrapper">
            <div class="photo-upload-container">
              <ImageCropUpload
                ref="photoUploadRef"
                v-model="formState.photo"
                folder="profile"
                placeholder="點擊上傳個人照片"
                help="支援 JPG、PNG、WebP，最大 10MB"
                :aspect-ratio="1"
                cropper-title="裁切個人照片"
                preview-class="profile-photo-preview"
              />
            </div>

            <!-- 照片操作按鈕（移出到右側） -->
            <div v-if="formState.photo" class="photo-actions">
              <button
                type="button"
                class="photo-action-btn photo-action-btn--change"
                @click="triggerPhotoChange"
                :disabled="isSaving"
              >
                <UIcon name="i-heroicons-arrow-path" />
                更換照片
              </button>
              <button
                type="button"
                class="photo-action-btn photo-action-btn--remove"
                @click="removePhoto"
                :disabled="isSaving"
              >
                <UIcon name="i-heroicons-trash" />
                移除照片
              </button>
            </div>
          </div>
        </div>

        <!-- 個人簡介 -->
        <div class="form-section">
          <div class="section-header">
            <div>
              <h3 class="section-title">個人簡介</h3>
              <p class="section-description">多段式簡介，每段顯示為一個段落</p>
            </div>
            <button
              type="button"
              class="add-button"
              @click="addBioLine"
              :disabled="isSaving"
            >
              <UIcon name="i-heroicons-plus" />
              新增段落
            </button>
          </div>

          <div class="bio-list">
            <div
              v-for="(line, index) in formState.bio"
              :key="index"
              class="bio-item"
            >
              <div class="bio-field">
                <label class="field-label">段落 {{ index + 1 }}</label>
                <textarea
                  v-model="formState.bio[index]"
                  class="field-textarea"
                  :placeholder="`請輸入第 ${index + 1} 段簡介`"
                  rows="3"
                  :disabled="isSaving"
                ></textarea>
              </div>
              <button
                v-if="formState.bio.length > 1"
                type="button"
                class="delete-button"
                @click="removeBioLine(index)"
                :disabled="isSaving"
                title="刪除此段落"
              >
                <UIcon name="i-heroicons-trash" />
              </button>
            </div>
          </div>
        </div>

        <!-- 設計理念 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">設計理念</h3>
            <p class="section-description">您的核心設計理念與價值觀</p>
          </div>

          <div class="form-field">
            <label class="field-label">
              設計理念
              <span class="required">*</span>
            </label>
            <textarea
              v-model="formState.philosophy"
              class="field-textarea"
              placeholder="請輸入您的設計理念"
              rows="6"
              :disabled="isSaving"
              required
            ></textarea>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <div class="actions-left">
            <button
              type="button"
              class="button button-secondary"
              @click="loadProfile"
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
              預覽
            </button>
            <button
              type="submit"
              class="button button-primary"
              :disabled="isSaving"
            >
              <UIcon v-if="isSaving" name="i-heroicons-arrow-path" class="animate-spin" />
              <UIcon v-else name="i-heroicons-check" />
              {{ isSaving ? '儲存中...' : '儲存變更' }}
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
.profile-form {
  max-width: 1200px;
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

/* Add Button */
.add-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px -2px rgba(59, 130, 246, 0.3);
}

.add-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px -4px rgba(59, 130, 246, 0.4);
}

.add-button:active:not(:disabled) {
  transform: translateY(0);
}

.add-button:disabled {
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
  min-height: 100px;
  font-family: inherit;
  line-height: 1.6;
}

.field-hint {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
}

/* Photo Upload */
.photo-upload-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
}

.photo-upload-container {
  flex-shrink: 0;
}

.photo-upload-container :deep(.profile-photo-preview) {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 50%;
}

.photo-upload-container :deep(.upload-preview) {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 4px solid #e2e8f0;
  overflow: hidden;
}

/* 隱藏組件內建的按鈕 */
.photo-upload-container :deep(.preview-actions) {
  display: none;
}

.photo-upload-container :deep(.upload-dropzone) {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  padding: 1rem;
}

.photo-upload-container :deep(.upload-icon) {
  width: 48px;
  height: 48px;
  margin-bottom: 0.5rem;
}

.photo-upload-container :deep(.upload-icon svg) {
  width: 24px;
  height: 24px;
}

.photo-upload-container :deep(.upload-text) {
  font-size: 0.875rem;
  text-align: center;
}

.photo-upload-container :deep(.upload-hint) {
  display: none;
}

/* 照片操作按鈕 - 外部 */
.photo-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;
}

.photo-action-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.75rem 1.25rem;
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.photo-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.photo-action-btn--change {
  background: #f8fafc;
  color: #475569;
  border-color: #e2e8f0;
}

.photo-action-btn--change:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #334155;
}

.photo-action-btn--remove {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.photo-action-btn--remove:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
  color: #b91c1c;
}

/* Bio List */
.bio-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.bio-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.bio-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.delete-button {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin-top: 1.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid #fee2e2;
  border-radius: 12px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.3s;
}

.delete-button:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #ef4444;
  transform: scale(1.05);
}

.delete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

  .add-button {
    width: 100%;
    justify-content: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field.full-width {
    grid-column: 1;
  }

  /* 照片上傳區塊響應式 */
  .photo-upload-wrapper {
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .photo-actions {
    flex-direction: row;
    width: 100%;
    padding-top: 0;
  }

  .photo-action-btn {
    flex: 1;
    justify-content: center;
  }

  .bio-item {
    flex-direction: column;
  }

  .delete-button {
    width: 100%;
    margin-top: 0;
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
