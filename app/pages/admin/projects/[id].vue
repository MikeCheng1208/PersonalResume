<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAdminAuth } from '~/composables/admin/useAdminAuth'
import { useAdminAPI } from '~/composables/admin/useAdminAPI'
import AdminLayout from '~/components/admin/AdminLayout.vue'
import ImageUpload from '~/components/admin/ImageUpload.vue'

definePageMeta({
  middleware: 'admin-auth'
})

const { hasPermission } = useAdminAuth()
const toast = useToast()
const api = useAdminAPI()
const router = useRouter()
const route = useRoute()

// 檢查權限
if (!hasPermission('projects:write')) {
  navigateTo('/admin/dashboard')
}

// 狀態管理
const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const showDeleteModal = ref(false)
const project = ref<any>(null)
const tagInput = ref('')

// 表單狀態
const formState = reactive({
  projectId: '',
  title: '',
  category: '',
  year: '',
  description: '',
  tags: [] as string[],
  color: '',
  coverGradient: '',
  overview: '',
  client: '',
  duration: '',
  role: '',
  tools: '',
  challenge: '',
  solution: '',
  images: [] as any[],
  results: [] as any[],
  showResults: false,
  published: false,
  featured: false,
  order: 0,
  slug: '',
  metaDescription: '',
  metaKeywords: [] as string[]
})

/**
 * 載入作品資料
 */
const loadProject = async () => {
  isLoading.value = true

  try {
    const id = route.params.id as string
    const response = await api.get(`/api/admin/projects/${id}`)
    project.value = response.project

    // 填充表單
    Object.assign(formState, {
      projectId: project.value.projectId,
      title: project.value.title,
      category: project.value.category,
      year: project.value.year,
      description: project.value.description,
      tags: [...project.value.tags],
      color: project.value.color,
      coverGradient: project.value.coverGradient,
      overview: project.value.overview,
      client: project.value.client,
      duration: project.value.duration,
      role: project.value.role,
      tools: project.value.tools,
      challenge: project.value.challenge,
      solution: project.value.solution,
      images: [...project.value.images],
      results: [...project.value.results],
      showResults: project.value.showResults !== false,
      published: project.value.published,
      featured: project.value.featured,
      order: project.value.order,
      slug: project.value.slug,
      metaDescription: project.value.metaDescription || '',
      metaKeywords: project.value.metaKeywords || []
    })
  } catch (error) {
    console.error('載入作品失敗:', error)
    toast.add({
      title: '載入失敗',
      description: '無法載入作品資料',
      color: 'error'
    })
    router.push('/admin/projects')
  } finally {
    isLoading.value = false
  }
}

/**
 * 新增標籤
 */
const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !formState.tags.includes(tag)) {
    formState.tags.push(tag)
    tagInput.value = ''
  }
}

/**
 * 移除標籤
 */
const removeTag = (index: number) => {
  formState.tags.splice(index, 1)
}

/**
 * 新增成果項目
 */
const addResult = () => {
  formState.results.push({
    value: '',
    label: ''
  })
}

/**
 * 移除成果項目
 */
const removeResult = (index: number) => {
  formState.results.splice(index, 1)
}

/**
 * 新增圖片項目
 */
const addImage = () => {
  formState.images.push({
    layout: 'full',
    src: '',
    gradient: 'from-slate-100 to-slate-200',
    label: '',
    caption: '',
    order: formState.images.length
  })
}

/**
 * 移除圖片項目
 */
const removeImage = (index: number) => {
  formState.images.splice(index, 1)
  // 重新計算 order
  formState.images.forEach((img, i) => {
    img.order = i
  })
}

/**
 * 移動圖片位置
 */
const moveImage = (index: number, direction: 'up' | 'down') => {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= formState.images.length) return

  const temp = formState.images[index]
  formState.images[index] = formState.images[newIndex]
  formState.images[newIndex] = temp

  // 重新計算 order
  formState.images.forEach((img, i) => {
    img.order = i
  })
}

/**
 * 提交表單
 */
const handleSubmit = async () => {
  isSaving.value = true

  try {
    const id = route.params.id as string
    await api.put(
      `/api/admin/projects/${id}`,
      formState,
      {
        showSuccessToast: true,
        successMessage: '作品更新成功'
      }
    )

    // 重新載入資料
    await loadProject()
  } catch (error) {
    console.error('更新作品失敗:', error)
  } finally {
    isSaving.value = false
  }
}

/**
 * 確認刪除
 */
const confirmDelete = () => {
  showDeleteModal.value = true
}

/**
 * 刪除作品
 */
const deleteProject = async () => {
  isDeleting.value = true

  try {
    const id = route.params.id as string
    await api.delete(
      `/api/admin/projects/${id}`,
      {
        showSuccessToast: true,
        successMessage: '作品已刪除'
      }
    )

    router.push('/admin/projects')
  } catch (error) {
    console.error('刪除作品失敗:', error)
  } finally {
    isDeleting.value = false
  }
}

// 初始載入
onMounted(() => {
  loadProject()
})
</script>

<template>
  <AdminLayout
    :page-title="isLoading ? '載入中...' : `編輯作品:${project?.title || ''}`"
    page-description="編輯作品集項目"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <UIcon name="i-heroicons-arrow-path" class="loading-icon" />
      <p>載入作品資料中...</p>
    </div>

    <!-- Form -->
    <div v-else-if="project" class="edit-container">
      <!-- Quick Actions -->
      <div class="quick-actions">
        <NuxtLink to="/admin/projects" class="back-button">
          <UIcon name="i-heroicons-arrow-left" />
          返回列表
        </NuxtLink>
        <NuxtLink :to="`/work/${project.projectId}`" target="_blank" class="preview-button">
          <UIcon name="i-heroicons-eye" />
          預覽
        </NuxtLink>
      </div>

      <form @submit.prevent="handleSubmit" class="form-card">
        <!-- 基本資訊 -->
        <div class="form-section">
          <h3 class="section-title">基本資訊</h3>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">
                Project ID <span class="required">*</span>
              </label>
              <input
                v-model="formState.projectId"
                type="text"
                class="form-input"
                :disabled="isSaving"
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                URL Slug <span class="required">*</span>
              </label>
              <input
                v-model="formState.slug"
                type="text"
                class="form-input"
                :disabled="isSaving"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              作品標題 <span class="required">*</span>
            </label>
            <input
              v-model="formState.title"
              type="text"
              class="form-input form-input-lg"
              :disabled="isSaving"
            />
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">
                分類 <span class="required">*</span>
              </label>
              <input
                v-model="formState.category"
                type="text"
                class="form-input"
                :disabled="isSaving"
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                年份 <span class="required">*</span>
              </label>
              <input
                v-model="formState.year"
                type="text"
                class="form-input"
                :disabled="isSaving"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              簡短描述 <span class="required">*</span>
            </label>
            <textarea
              v-model="formState.description"
              rows="3"
              class="form-textarea"
              :disabled="isSaving"
            ></textarea>
          </div>

          <!-- Tags -->
          <div class="form-group">
            <label class="form-label">標籤</label>
            <div class="tags-group">
              <div v-if="formState.tags.length > 0" class="tags-display">
                <div
                  v-for="(tag, index) in formState.tags"
                  :key="index"
                  class="tag-badge"
                >
                  <span>{{ tag }}</span>
                  <button
                    type="button"
                    @click="removeTag(index)"
                    class="tag-remove"
                    :disabled="isSaving"
                  >
                    <UIcon name="i-heroicons-x-mark" />
                  </button>
                </div>
              </div>
              <input
                v-model="tagInput"
                type="text"
                class="form-input"
                placeholder="按 Enter 新增標籤"
                @keydown.enter.prevent="addTag"
                :disabled="isSaving"
              />
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label class="form-label">
                卡片顏色 <span class="required">*</span>
              </label>
              <input
                v-model="formState.color"
                type="text"
                class="form-input"
                :disabled="isSaving"
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                封面漸層 <span class="required">*</span>
              </label>
              <input
                v-model="formState.coverGradient"
                type="text"
                class="form-input"
                :disabled="isSaving"
              />
            </div>
          </div>
        </div>

        <div class="form-divider"></div>

        <!-- 專案詳情 -->
        <div class="form-section">
          <h3 class="section-title">專案詳情</h3>

          <div class="form-group">
            <label class="form-label">
              專案概述 <span class="required">*</span>
            </label>
            <textarea
              v-model="formState.overview"
              rows="4"
              class="form-textarea"
              :disabled="isSaving"
            ></textarea>
          </div>

          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label">
                客戶 <span class="required">*</span>
              </label>
              <input
                v-model="formState.client"
                type="text"
                class="form-input"
                :disabled="isSaving"
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                時程 <span class="required">*</span>
              </label>
              <input
                v-model="formState.duration"
                type="text"
                class="form-input"
                :disabled="isSaving"
              />
            </div>

            <div class="form-group">
              <label class="form-label">
                角色 <span class="required">*</span>
              </label>
              <input
                v-model="formState.role"
                type="text"
                class="form-input"
                :disabled="isSaving"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              使用工具 <span class="required">*</span>
            </label>
            <input
              v-model="formState.tools"
              type="text"
              class="form-input"
              :disabled="isSaving"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              挑戰 <span class="required">*</span>
            </label>
            <textarea
              v-model="formState.challenge"
              rows="4"
              class="form-textarea"
              :disabled="isSaving"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">
              解決方案 <span class="required">*</span>
            </label>
            <textarea
              v-model="formState.solution"
              rows="4"
              class="form-textarea"
              :disabled="isSaving"
            ></textarea>
          </div>
        </div>

        <div class="form-divider"></div>

        <!-- 作品圖片 -->
        <div class="form-section">
          <h3 class="section-title">作品圖片</h3>

          <div class="images-section">
            <div class="images-header">
              <p class="images-description">上傳作品展示圖片，支援全寬或半寬版面配置</p>
              <button
                type="button"
                class="add-image-button"
                @click="addImage"
                :disabled="isSaving"
              >
                <UIcon name="i-heroicons-plus" />
                新增圖片
              </button>
            </div>

            <div v-if="formState.images.length === 0" class="empty-images">
              <UIcon name="i-heroicons-photo" class="empty-icon" />
              <p>尚無作品圖片，點擊「新增圖片」開始添加。</p>
            </div>

            <div v-else class="images-list">
              <div
                v-for="(image, index) in formState.images"
                :key="index"
                class="image-item"
              >
                <div class="image-item-header">
                  <span class="image-item-number">圖片 #{{ index + 1 }}</span>
                  <div class="image-item-actions">
                    <button
                      type="button"
                      class="move-button"
                      @click="moveImage(index, 'up')"
                      :disabled="isSaving || index === 0"
                      title="上移"
                    >
                      <UIcon name="i-heroicons-chevron-up" />
                    </button>
                    <button
                      type="button"
                      class="move-button"
                      @click="moveImage(index, 'down')"
                      :disabled="isSaving || index === formState.images.length - 1"
                      title="下移"
                    >
                      <UIcon name="i-heroicons-chevron-down" />
                    </button>
                    <button
                      type="button"
                      class="remove-image-button"
                      @click="removeImage(index)"
                      :disabled="isSaving"
                    >
                      <UIcon name="i-heroicons-trash" />
                    </button>
                  </div>
                </div>

                <div class="image-item-content">
                  <!-- 圖片上傳區 -->
                  <div class="image-upload-area">
                    <ImageUpload
                      v-model="formState.images[index].src"
                      :folder="`projects/${formState.projectId}`"
                      placeholder="點擊或拖曳上傳圖片"
                      help="支援 JPG、PNG、GIF、WebP，最大 10MB"
                      preview-class="project-image-preview"
                    />
                  </div>

                  <!-- 圖片設定 -->
                  <div class="image-settings">
                    <div class="form-grid-2">
                      <div class="form-group">
                        <label class="form-label">版面配置</label>
                        <select
                          v-model="formState.images[index].layout"
                          class="form-select"
                          :disabled="isSaving"
                        >
                          <option value="full">全寬 (Full Width)</option>
                          <option value="half">半寬 (Half Width)</option>
                        </select>
                        <p class="form-hint">全寬佔滿整行，半寬可並列顯示</p>
                      </div>

                      <div class="form-group">
                        <label class="form-label">漸層背景</label>
                        <input
                          v-model="formState.images[index].gradient"
                          type="text"
                          class="form-input"
                          placeholder="from-slate-100 to-slate-200"
                          :disabled="isSaving"
                        />
                        <p class="form-hint">圖片載入前的背景漸層</p>
                      </div>
                    </div>

                    <div class="form-grid-2">
                      <div class="form-group">
                        <label class="form-label">
                          標籤 <span class="required">*</span>
                        </label>
                        <input
                          v-model="formState.images[index].label"
                          type="text"
                          class="form-input"
                          placeholder="例如: 首頁設計"
                          :disabled="isSaving"
                        />
                      </div>

                      <div class="form-group">
                        <label class="form-label">說明文字</label>
                        <input
                          v-model="formState.images[index].caption"
                          type="text"
                          class="form-input"
                          placeholder="選填：圖片說明"
                          :disabled="isSaving"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-divider"></div>

        <!-- 成果設定 -->
        <div class="form-section">
          <h3 class="section-title">成果設定</h3>

          <!-- 顯示開關 -->
          <div class="form-group">
            <label class="form-label">顯示成果區塊</label>
            <div class="toggle-group">
              <label class="switch">
                <input type="checkbox" v-model="formState.showResults" :disabled="isSaving" />
                <span class="slider"></span>
              </label>
              <span class="toggle-text">
                {{ formState.showResults ? "顯示" : "隱藏" }}
              </span>
            </div>
            <p class="form-hint">控制此專案在前台是否顯示成果區塊</p>
          </div>

          <!-- 成果列表 -->
          <div v-if="formState.showResults" class="results-section">
            <div class="results-header">
              <label class="form-label">成果項目</label>
              <button
                type="button"
                class="add-result-button"
                @click="addResult"
                :disabled="isSaving"
              >
                <UIcon name="i-heroicons-plus" />
                新增成果
              </button>
            </div>

            <div v-if="formState.results.length === 0" class="empty-results">
              <p>尚無成果項目,點擊「新增成果」開始添加。</p>
            </div>

            <div v-else class="results-list">
              <div
                v-for="(result, index) in formState.results"
                :key="index"
                class="result-item"
              >
                <div class="result-item-header">
                  <span class="result-item-number">成果 #{{ index + 1 }}</span>
                  <button
                    type="button"
                    class="remove-result-button"
                    @click="removeResult(index)"
                    :disabled="isSaving"
                  >
                    <UIcon name="i-heroicons-trash" />
                  </button>
                </div>

                <div class="result-item-fields">
                  <div class="form-group">
                    <label class="form-label">數值</label>
                    <input
                      v-model="formState.results[index].value"
                      type="text"
                      class="form-input"
                      placeholder="例如: +150%"
                      :disabled="isSaving"
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">說明</label>
                    <input
                      v-model="formState.results[index].label"
                      type="text"
                      class="form-input"
                      placeholder="例如: 轉換率提升"
                      :disabled="isSaving"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-divider"></div>

        <!-- 發布設定 -->
        <div class="form-section">
          <h3 class="section-title">發布設定</h3>

          <div class="form-grid-3">
            <div class="form-group">
              <label class="form-label">發布狀態</label>
              <div class="toggle-group">
                <label class="switch">
                  <input type="checkbox" v-model="formState.published" :disabled="isSaving" />
                  <span class="slider"></span>
                </label>
                <span class="toggle-text">
                  {{ formState.published ? "已發布" : "草稿" }}
                </span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">精選作品</label>
              <div class="toggle-group">
                <label class="switch">
                  <input type="checkbox" v-model="formState.featured" :disabled="isSaving" />
                  <span class="slider"></span>
                </label>
                <span class="toggle-text">
                  {{ formState.featured ? "是" : "否" }}
                </span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">排序</label>
              <input
                v-model.number="formState.order"
                type="number"
                class="form-input"
                :disabled="isSaving"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button
            type="button"
            class="delete-action-button"
            @click="confirmDelete"
            :disabled="isSaving"
          >
            <UIcon name="i-heroicons-trash" />
            刪除作品
          </button>

          <div class="action-buttons">
            <NuxtLink to="/admin/projects" class="cancel-button">
              取消
            </NuxtLink>
            <button
              type="submit"
              class="submit-button"
              :disabled="isSaving"
            >
              {{ isSaving ? '儲存中...' : '儲存變更' }}
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>確認刪除</h3>
        </div>

        <div class="modal-body">
          <p class="delete-message">
            確定要刪除作品「<strong>{{ project?.title }}</strong>」嗎?此操作無法復原。
          </p>
        </div>

        <div class="modal-footer">
          <button class="cancel-button" @click="showDeleteModal = false">
            取消
          </button>
          <button
            class="delete-button"
            :disabled="isDeleting"
            @click="deleteProject"
          >
            {{ isDeleting ? '刪除中...' : '確認刪除' }}
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #64748b;
}

.loading-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 12px;
  color: #3b82f6;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.edit-container {
  max-width: 100%;
  margin: 0 auto;
}

/* Quick Actions */
.quick-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.back-button, .preview-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.back-button {
  background: white;
  border: 1px solid #e5e7eb;
  color: #64748b;
}

.back-button:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.preview-button {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #64748b;
}

.preview-button:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* Form Card */
.form-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 32px;
}

@media (max-width: 768px) {
  .form-card {
    padding: 24px;
  }
}

.form-section {
  margin-bottom: 32px;
}

.form-section:last-of-type {
  margin-bottom: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.form-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 32px 0;
}

/* Form Elements */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.required {
  color: #ef4444;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  color: #0f172a;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input-lg {
  padding: 14px 16px;
  font-size: 16px;
  font-weight: 500;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:disabled, .form-textarea:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .form-grid-2 {
    grid-template-columns: 1fr 1fr;
  }
}

.form-grid-3 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 768px) {
  .form-grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Tags */
.tags-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.tag-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #1e40af;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.tag-remove:hover:not(:disabled) {
  color: #dc2626;
}

.tag-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Form Hint */
.form-hint {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 6px;
  margin-bottom: 0;
}

/* Results Section */
.results-section {
  margin-top: 20px;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.add-result-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.add-result-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.add-result-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.empty-results {
  padding: 40px 20px;
  text-align: center;
  background: #f8fafc;
  border: 2px dashed #e5e7eb;
  border-radius: 12px;
}

.empty-results p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.result-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.result-item-number {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.remove-result-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-result-button:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
}

.remove-result-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.result-item-fields {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 640px) {
  .result-item-fields {
    grid-template-columns: 1fr 2fr;
  }
}

.result-item-fields .form-group {
  margin-bottom: 0;
}

/* Toggle */
.toggle-group {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.toggle-text {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

/* Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

input:disabled + .slider {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Form Actions */
.form-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
  margin-top: 32px;
}

@media (min-width: 640px) {
  .form-actions {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.delete-action-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-action-button:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
}

.delete-action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.cancel-button {
  padding: 10px 24px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-block;
}

.cancel-button:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.submit-button {
  padding: 10px 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 16px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  animation: slideUp 0.3s ease-out;
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

.modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.delete-message {
  font-size: 15px;
  color: #475569;
  margin: 0;
}

.delete-message strong {
  color: #0f172a;
}

.delete-button {
  padding: 10px 24px;
  background: #ef4444;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-button:hover:not(:disabled) {
  background: #dc2626;
}

.delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Images Section */
.images-section {
  margin-top: 8px;
}

.images-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}

.images-description {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.add-image-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  flex-shrink: 0;
}

.add-image-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.add-image-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.empty-images {
  padding: 60px 20px;
  text-align: center;
  background: #f8fafc;
  border: 2px dashed #e5e7eb;
  border-radius: 16px;
}

.empty-images .empty-icon {
  width: 48px;
  height: 48px;
  color: #cbd5e1;
  margin-bottom: 12px;
}

.empty-images p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.images-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.image-item {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.image-item:hover {
  border-color: #cbd5e1;
}

.image-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.image-item-number {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.image-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.move-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.move-button:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #3b82f6;
}

.move-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.remove-image-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-image-button:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
}

.remove-image-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-item-content {
  padding: 20px;
}

.image-upload-area {
  margin-bottom: 20px;
}

.image-upload-area :deep(.project-image-preview) {
  max-height: 400px;
  object-fit: contain;
}

.image-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Select */
.form-select {
  width: 100%;
  padding: 12px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  color: #0f172a;
  transition: all 0.2s ease;
  font-family: inherit;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 20px;
  padding-right: 44px;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-select:disabled {
  background-color: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}
</style>
