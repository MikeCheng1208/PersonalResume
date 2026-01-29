<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue?: string
  alt?: string
  placeholder?: string
  help?: string
  folder?: string
  accept?: string
  maxSize?: number // MB
  previewClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  alt: '圖片預覽',
  placeholder: '點擊或拖曳圖片至此上傳',
  help: '支援 JPG、PNG、GIF、WebP，最大 10MB',
  folder: 'images',
  accept: 'image/jpeg,image/png,image/gif,image/webp',
  maxSize: 10,
  previewClass: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const isDragging = ref(false)
const uploadProgress = ref(0)

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
    await uploadFile(file)
  }
  // 重置 input 以便可以重複上傳相同檔案
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
    await uploadFile(file)
  }
}

/**
 * 上傳檔案
 */
const uploadFile = async (file: File) => {
  // 驗證檔案類型
  const allowedTypes = props.accept.split(',')
  if (!allowedTypes.includes(file.type)) {
    toast.add({
      title: '格式錯誤',
      description: '請上傳 JPG、PNG、GIF 或 WebP 格式的圖片',
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

  isUploading.value = true
  uploadProgress.value = 0

  try {
    // 建立 FormData
    const formData = new FormData()
    formData.append('file', file)
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
  }
}

/**
 * 移除圖片
 */
const handleRemove = async () => {
  const currentUrl = props.modelValue

  // 先清除本地顯示
  emit('update:modelValue', '')

  // 嘗試從伺服器刪除（非必要，失敗也不影響使用）
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
</script>

<template>
  <div class="image-upload">
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
          <UIcon name="i-heroicons-cloud-arrow-up" />
        </div>
        <p class="upload-text">{{ placeholder }}</p>
        <p class="upload-hint">{{ help }}</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.image-upload {
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
}

.upload-icon :deep(svg) {
  width: 48px;
  height: 48px;
}

.upload-dropzone:hover .upload-icon {
  color: #3b82f6;
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
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
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
</style>
