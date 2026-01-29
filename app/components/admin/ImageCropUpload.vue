<script setup lang="ts">
import { ref, computed } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

interface Props {
  modelValue?: string
  alt?: string
  placeholder?: string
  help?: string
  folder?: string
  accept?: string
  maxSize?: number // MB
  aspectRatio?: number // 寬高比，例如 1 代表 1:1
  previewClass?: string
  cropperTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  alt: '圖片預覽',
  placeholder: '點擊或拖曳圖片至此上傳',
  help: '支援 JPG、PNG、WebP，最大 10MB',
  folder: 'images',
  accept: 'image/jpeg,image/png,image/webp',
  maxSize: 10,
  aspectRatio: 1,
  previewClass: '',
  cropperTitle: '裁切圖片'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const cropperRef = ref<any>(null)
const isUploading = ref(false)
const isDragging = ref(false)
const uploadProgress = ref(0)

// 裁切對話框狀態
const showCropModal = ref(false)
const originalImage = ref<string>('')

/**
 * 觸發檔案選擇
 */
const triggerFileSelect = () => {
  fileInput.value?.click()
}

/**
 * 處理檔案選擇
 */
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await prepareForCrop(file)
  }
  // 重置 input 以便可以重複選擇相同檔案
  if (target) {
    target.value = ''
  }
}

/**
 * 處理拖曳
 */
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  const file = event.dataTransfer?.files?.[0]
  if (file) {
    await prepareForCrop(file)
  }
}

/**
 * 準備裁切
 */
const prepareForCrop = async (file: File) => {
  // 驗證檔案類型
  const allowedTypes = props.accept.split(',')
  if (!allowedTypes.includes(file.type)) {
    toast.add({
      title: '格式錯誤',
      description: '請上傳 JPG、PNG 或 WebP 格式的圖片',
      color: 'error',
      icon: 'i-heroicons-x-circle'
    })
    return
  }

  // 驗證檔案大小
  const maxBytes = props.maxSize * 1024 * 1024
  if (file.size > maxBytes) {
    toast.add({
      title: '檔案過大',
      description: `圖片大小不能超過 ${props.maxSize}MB`,
      color: 'error',
      icon: 'i-heroicons-x-circle'
    })
    return
  }

  // 讀取檔案為 Data URL
  const reader = new FileReader()
  reader.onload = (e) => {
    originalImage.value = e.target?.result as string
    showCropModal.value = true
  }
  reader.readAsDataURL(file)
}

/**
 * 確認裁切並上傳
 */
const confirmCrop = async () => {
  if (!cropperRef.value) return

  const { canvas } = cropperRef.value.getResult()
  if (!canvas) return

  isUploading.value = true
  uploadProgress.value = 0
  showCropModal.value = false

  try {
    // 將 canvas 轉為 Blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob: Blob | null) => {
          if (blob) resolve(blob)
          else reject(new Error('無法處理圖片'))
        },
        'image/jpeg',
        0.9
      )
    })

    // 建立 FormData
    const formData = new FormData()
    formData.append('file', blob, `cropped-${Date.now()}.jpg`)
    formData.append('folder', props.folder)

    // 模擬上傳進度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += Math.random() * 20
      }
    }, 200)

    // 上傳到伺服器
    const response = await $fetch<{
      success: boolean
      message: string
      data: {
        url: string
        fileName: string
        originalName: string
        size: number
      }
    }>('/api/admin/upload/image', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (response.success && response.data) {
      emit('update:modelValue', response.data.url)

      toast.add({
        title: '上傳成功',
        description: '圖片已成功上傳',
        color: 'success',
        icon: 'i-heroicons-check-circle'
      })
    }
  } catch (error: any) {
    console.error('上傳失敗:', error)

    toast.add({
      title: '上傳失敗',
      description: error?.data?.message || '圖片上傳時發生錯誤',
      color: 'error',
      icon: 'i-heroicons-x-circle'
    })
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
    originalImage.value = ''
  }
}

/**
 * 取消裁切
 */
const cancelCrop = () => {
  showCropModal.value = false
  originalImage.value = ''
}

/**
 * 移除圖片
 */
const handleRemove = async () => {
  const currentUrl = props.modelValue

  // 先清除本地顯示
  emit('update:modelValue', '')

  // 嘗試從伺服器刪除
  if (currentUrl && currentUrl.includes('minio')) {
    try {
      await $fetch('/api/admin/upload/delete', {
        method: 'POST',
        body: { url: currentUrl },
        credentials: 'include'
      })
    } catch (error) {
      console.warn('刪除遠端檔案失敗:', error)
    }
  }

  toast.add({
    title: '已移除',
    description: '圖片已移除',
    color: 'neutral',
    icon: 'i-heroicons-trash'
  })
}

// 裁切區域的限制
const stencilProps = computed(() => ({
  aspectRatio: props.aspectRatio
}))

// 暴露方法供外部調用
defineExpose({
  triggerFileSelect,
  handleRemove
})
</script>

<template>
  <div class="image-crop-upload">
    <!-- 隱藏的 file input -->
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      class="hidden"
      @change="handleFileSelect"
    />

    <!-- 有圖片時顯示預覽 -->
    <div v-if="modelValue" class="upload-preview">
      <img
        :src="modelValue"
        :alt="alt"
        class="preview-image"
        :class="previewClass"
      />
      <div class="preview-actions">
        <button
          type="button"
          class="action-btn action-btn--change"
          @click="triggerFileSelect"
          :disabled="isUploading"
        >
          <UIcon name="i-heroicons-arrow-path" />
          更換圖片
        </button>
        <button
          type="button"
          class="action-btn action-btn--remove"
          @click="handleRemove"
          :disabled="isUploading"
        >
          <UIcon name="i-heroicons-trash" />
          移除
        </button>
      </div>
    </div>

    <!-- 無圖片時顯示上傳區域 -->
    <div
      v-else
      class="upload-dropzone"
      :class="{
        'upload-dropzone--dragging': isDragging,
        'upload-dropzone--uploading': isUploading
      }"
      @click="triggerFileSelect"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <!-- 上傳中 -->
      <template v-if="isUploading">
        <div class="upload-progress">
          <UIcon name="i-heroicons-arrow-path" class="upload-spinner" />
          <p class="upload-progress-text">上傳中... {{ Math.round(uploadProgress) }}%</p>
          <div class="progress-bar">
            <div class="progress-bar-fill" :style="{ width: `${uploadProgress}%` }" />
          </div>
        </div>
      </template>

      <!-- 等待上傳 -->
      <template v-else>
        <div class="upload-icon">
          <UIcon name="i-heroicons-camera" />
        </div>
        <p class="upload-text">{{ placeholder }}</p>
        <p class="upload-hint">{{ help }}</p>
        <p class="upload-hint">圖片將裁切為 {{ aspectRatio === 1 ? '1:1 正方形' : `${aspectRatio}:1` }}</p>
      </template>
    </div>

    <!-- 裁切對話框 -->
    <Teleport to="body">
      <div v-if="showCropModal" class="crop-modal-overlay" @click.self="cancelCrop">
        <div class="crop-modal">
          <div class="crop-modal-header">
            <h3>{{ cropperTitle }}</h3>
            <button type="button" class="close-btn" @click="cancelCrop">
              <UIcon name="i-heroicons-x-mark" />
            </button>
          </div>

          <div class="crop-modal-body">
            <ClientOnly>
              <Cropper
                ref="cropperRef"
                class="cropper"
                :src="originalImage"
                :stencil-props="stencilProps"
                :resize-image="{
                  adjustStencil: false
                }"
                image-restriction="stencil"
              />
            </ClientOnly>
          </div>

          <div class="crop-modal-footer">
            <button type="button" class="btn btn-secondary" @click="cancelCrop">
              取消
            </button>
            <button type="button" class="btn btn-primary" @click="confirmCrop">
              <UIcon name="i-heroicons-check" />
              確認裁切並上傳
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.image-crop-upload {
  width: 100%;
}

/* 預覽區域 */
.upload-preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
}

.preview-image {
  width: 100%;
  height: auto;
  max-height: 300px;
  object-fit: cover;
  display: block;
}

.preview-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn--change {
  background: white;
  color: #1f2937;
}

.action-btn--change:hover:not(:disabled) {
  background: #f3f4f6;
}

.action-btn--remove {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.action-btn--remove:hover:not(:disabled) {
  background: #ef4444;
}

/* 上傳區域 */
.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-dropzone:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-dropzone--dragging {
  border-color: #3b82f6;
  background: #dbeafe;
  border-style: solid;
}

.upload-dropzone--uploading {
  cursor: default;
  border-color: #3b82f6;
}

.upload-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: #94a3b8;
  background: #e2e8f0;
  border-radius: 50%;
}

.upload-icon :deep(svg) {
  width: 32px;
  height: 32px;
}

.upload-dropzone:hover .upload-icon {
  color: #3b82f6;
  background: #dbeafe;
}

.upload-text {
  font-size: 1rem;
  font-weight: 500;
  color: #475569;
  margin: 0 0 0.5rem;
}

.upload-hint {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
}

/* 上傳進度 */
.upload-progress {
  text-align: center;
  width: 100%;
  max-width: 200px;
}

.upload-spinner {
  width: 40px;
  height: 40px;
  color: #3b82f6;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.upload-progress-text {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #3b82f6;
  margin: 0 0 0.75rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 裁切對話框 */
.crop-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.crop-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.crop-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.crop-modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: #f1f5f9;
  border: none;
  border-radius: 10px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.crop-modal-body {
  flex: 1;
  padding: 1.5rem;
  min-height: 300px;
  max-height: 60vh;
  overflow: hidden;
}

.cropper {
  width: 100%;
  height: 100%;
  min-height: 300px;
  max-height: 50vh;
  background: #1a1a1a;
  border-radius: 12px;
}

.crop-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* 響應式 */
@media (max-width: 640px) {
  .crop-modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .crop-modal-body {
    padding: 1rem;
  }

  .crop-modal-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
