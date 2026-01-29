<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
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

// 檢查權限
if (!hasPermission('projects:write')) {
  navigateTo('/admin/dashboard')
}

// 狀態管理
const isSaving = ref(false)
const tagInput = ref('')

// 表單狀態
const formState = reactive({
  projectId: '',
  title: '',
  category: '',
  year: new Date().getFullYear().toString(),
  description: '',
  tags: [] as string[],
  color: '',
  coverImage: '',
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
  published: false,
  featured: false,
  order: 0,
  slug: '',
  metaDescription: '',
  metaKeywords: [] as string[]
})

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
  // 驗證必填欄位
  const requiredFields = {
    projectId: 'Project ID',
    title: '作品標題',
    category: '分類',
    year: '年份',
    description: '簡短描述',
    color: '卡片顏色',
    coverGradient: '封面漸層',
    overview: '專案概述',
    client: '客戶',
    duration: '時程',
    role: '角色',
    tools: '使用工具',
    challenge: '挑戰',
    solution: '解決方案',
    slug: 'URL Slug'
  }

  for (const [field, label] of Object.entries(requiredFields)) {
    if (!formState[field as keyof typeof formState]) {
      toast.add({
        title: '驗證失敗',
        description: `請填寫「${label}」`,
        color: 'error'
      })
      return
    }
  }

  isSaving.value = true

  try {
    const response = await api.post(
      '/api/admin/projects',
      formState,
      {
        showSuccessToast: true,
        successMessage: '作品建立成功'
      }
    )

    // 導向編輯頁面
    router.push(`/admin/projects/${response.project._id}`)
  } catch (error) {
    console.error('建立作品失敗:', error)
  } finally {
    isSaving.value = false
  }
}

// 自動同步 projectId 到 slug
watch(() => formState.projectId, (newValue) => {
  if (!formState.slug) {
    formState.slug = newValue
  }
})
</script>

<template>
  <AdminLayout page-title="新增作品" page-description="建立新的作品集項目">
    <div class="new-project-form">
      <form @submit.prevent="handleSubmit" class="form-container">
        <!-- 基本資訊 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">基本資訊</h3>
            <p class="section-description">作品的識別資訊與基本設定</p>
          </div>

          <div class="form-grid">
            <!-- Project ID -->
            <div class="form-field">
              <label class="field-label">
                Project ID
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.projectId"
                type="text"
                class="field-input"
                placeholder="fintech-app"
                :disabled="isSaving"
              />
              <p class="field-hint">URL 友善的唯一識別碼</p>
            </div>

            <!-- Slug -->
            <div class="form-field">
              <label class="field-label">
                URL Slug
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.slug"
                type="text"
                class="field-input"
                placeholder="fintech-app"
                :disabled="isSaving"
              />
              <p class="field-hint">用於 SEO 的網址路徑</p>
            </div>

            <!-- Title -->
            <div class="form-field full-width">
              <label class="field-label">
                作品標題
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.title"
                type="text"
                class="field-input field-input-lg"
                placeholder="請輸入作品標題"
                :disabled="isSaving"
              />
            </div>

            <!-- Category -->
            <div class="form-field">
              <label class="field-label">
                分類
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.category"
                type="text"
                class="field-input"
                placeholder="例如: UI/UX Design"
                :disabled="isSaving"
              />
            </div>

            <!-- Year -->
            <div class="form-field">
              <label class="field-label">
                年份
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.year"
                type="text"
                class="field-input"
                placeholder="2024"
                :disabled="isSaving"
              />
            </div>

            <!-- Description -->
            <div class="form-field full-width">
              <label class="field-label">
                簡短描述
                <span class="required">*</span>
              </label>
              <textarea
                v-model="formState.description"
                class="field-textarea"
                placeholder="請輸入作品的簡短描述"
                rows="3"
                :disabled="isSaving"
              ></textarea>
            </div>

            <!-- Tags -->
            <div class="form-field full-width">
              <label class="field-label">標籤</label>
              <div class="tags-container">
                <div v-if="formState.tags.length > 0" class="tags-list">
                  <span
                    v-for="(tag, index) in formState.tags"
                    :key="index"
                    class="tag"
                  >
                    {{ tag }}
                    <button
                      type="button"
                      class="tag-remove"
                      @click="removeTag(index)"
                    >
                      <UIcon name="i-heroicons-x-mark" />
                    </button>
                  </span>
                </div>
                <input
                  v-model="tagInput"
                  type="text"
                  class="field-input"
                  placeholder="輸入標籤後按 Enter"
                  @keydown.enter.prevent="addTag"
                  :disabled="isSaving"
                />
              </div>
              <p class="field-hint">按 Enter 新增標籤</p>
            </div>

            <!-- Color -->
            <div class="form-field full-width">
              <label class="field-label">
                卡片顏色
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.color"
                type="text"
                class="field-input"
                placeholder="#667EEA"
                :disabled="isSaving"
              />
              <p class="field-hint">作品列表卡片的背景色</p>
            </div>
          </div>
        </div>

        <!-- 專案詳情 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">專案詳情</h3>
            <p class="section-description">專案的詳細資訊與內容描述</p>
          </div>

          <div class="form-grid">
            <!-- Overview -->
            <div class="form-field full-width">
              <label class="field-label">
                專案概述
                <span class="required">*</span>
              </label>
              <textarea
                v-model="formState.overview"
                class="field-textarea"
                placeholder="請輸入專案概述"
                rows="4"
                :disabled="isSaving"
              ></textarea>
            </div>

            <!-- Client -->
            <div class="form-field">
              <label class="field-label">
                客戶
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.client"
                type="text"
                class="field-input"
                placeholder="客戶名稱"
                :disabled="isSaving"
              />
            </div>

            <!-- Duration -->
            <div class="form-field">
              <label class="field-label">
                時程
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.duration"
                type="text"
                class="field-input"
                placeholder="3 個月"
                :disabled="isSaving"
              />
            </div>

            <!-- Role -->
            <div class="form-field">
              <label class="field-label">
                角色
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.role"
                type="text"
                class="field-input"
                placeholder="UI/UX Designer"
                :disabled="isSaving"
              />
            </div>

            <!-- Tools -->
            <div class="form-field full-width">
              <label class="field-label">
                使用工具
                <span class="required">*</span>
              </label>
              <input
                v-model="formState.tools"
                type="text"
                class="field-input"
                placeholder="Figma, Sketch, Adobe XD"
                :disabled="isSaving"
              />
            </div>

            <!-- Challenge -->
            <div class="form-field full-width">
              <label class="field-label">
                挑戰
                <span class="required">*</span>
              </label>
              <textarea
                v-model="formState.challenge"
                class="field-textarea"
                placeholder="請描述專案面臨的挑戰"
                rows="4"
                :disabled="isSaving"
              ></textarea>
            </div>

            <!-- Solution -->
            <div class="form-field full-width">
              <label class="field-label">
                解決方案
                <span class="required">*</span>
              </label>
              <textarea
                v-model="formState.solution"
                class="field-textarea"
                placeholder="請描述如何解決挑戰"
                rows="4"
                :disabled="isSaving"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- 作品封面設定 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">作品封面設定</h3>
            <p class="section-description">設定作品卡片和分享時顯示的封面圖片</p>
          </div>

          <div class="cover-section">
            <div class="cover-upload-area">
              <label class="field-label">封面圖片</label>
              <ImageUpload
                v-model="formState.coverImage"
                :folder="`projects/${formState.projectId || 'new'}/cover`"
                placeholder="點擊或拖曳上傳封面圖片"
                help="建議尺寸 1200x630，支援 JPG、PNG、WebP"
                preview-class="cover-image-preview"
              />
              <p class="field-hint">作品卡片和分享時顯示的主要圖片</p>
            </div>

            <div class="cover-gradient-area">
              <div class="form-field">
                <label class="field-label">
                  封面漸層色
                  <span class="required">*</span>
                </label>
                <input
                  v-model="formState.coverGradient"
                  type="text"
                  class="field-input"
                  placeholder="from-blue-500 to-purple-600"
                  :disabled="isSaving"
                />
                <p class="field-hint">當封面圖片載入中或未設定時顯示的漸層背景</p>
              </div>

              <!-- 漸層預覽 -->
              <div class="gradient-preview-wrapper">
                <label class="field-label">漸層預覽</label>
                <div
                  class="gradient-preview"
                  :class="`bg-gradient-to-br ${formState.coverGradient}`"
                >
                  <span v-if="!formState.coverGradient" class="preview-placeholder">
                    輸入漸層色後預覽
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 作品圖片 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">作品圖片</h3>
            <p class="section-description">上傳作品展示圖片，支援全寬或半寬版面配置</p>
          </div>

          <div class="images-section">
            <div class="images-header">
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
                      :folder="`projects/${formState.projectId || 'new'}`"
                      placeholder="點擊或拖曳上傳圖片"
                      help="支援 JPG、PNG、GIF、WebP，最大 10MB"
                      preview-class="project-image-preview"
                    />
                  </div>

                  <!-- 圖片設定 -->
                  <div class="image-settings">
                    <div class="form-grid">
                      <div class="form-field">
                        <label class="field-label">版面配置</label>
                        <select
                          v-model="formState.images[index].layout"
                          class="field-select"
                          :disabled="isSaving"
                        >
                          <option value="full">全寬 (Full Width)</option>
                          <option value="half">半寬 (Half Width)</option>
                        </select>
                        <p class="field-hint">全寬佔滿整行，半寬可並列顯示</p>
                      </div>

                      <div class="form-field">
                        <label class="field-label">漸層背景</label>
                        <input
                          v-model="formState.images[index].gradient"
                          type="text"
                          class="field-input"
                          placeholder="from-slate-100 to-slate-200"
                          :disabled="isSaving"
                        />
                        <p class="field-hint">圖片載入前的背景漸層</p>
                      </div>
                    </div>

                    <div class="form-grid">
                      <div class="form-field">
                        <label class="field-label">
                          標籤 <span class="required">*</span>
                        </label>
                        <input
                          v-model="formState.images[index].label"
                          type="text"
                          class="field-input"
                          placeholder="例如: 首頁設計"
                          :disabled="isSaving"
                        />
                      </div>

                      <div class="form-field">
                        <label class="field-label">說明文字</label>
                        <input
                          v-model="formState.images[index].caption"
                          type="text"
                          class="field-input"
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

        <!-- 發布設定 -->
        <div class="form-section">
          <div class="section-header">
            <h3 class="section-title">發布設定</h3>
            <p class="section-description">控制作品的發布狀態與顯示順序</p>
          </div>

          <div class="form-grid three-cols">
            <!-- Published -->
            <div class="form-field">
              <label class="field-label">發布狀態</label>
              <div class="switch-field">
                <label class="switch">
                  <input
                    type="checkbox"
                    v-model="formState.published"
                    :disabled="isSaving"
                  />
                  <span class="slider"></span>
                </label>
                <span class="switch-label">{{ formState.published ? '已發布' : '草稿' }}</span>
              </div>
            </div>

            <!-- Featured -->
            <div class="form-field">
              <label class="field-label">精選作品</label>
              <div class="switch-field">
                <label class="switch">
                  <input
                    type="checkbox"
                    v-model="formState.featured"
                    :disabled="isSaving"
                  />
                  <span class="slider"></span>
                </label>
                <span class="switch-label">{{ formState.featured ? '是' : '否' }}</span>
              </div>
            </div>

            <!-- Order -->
            <div class="form-field">
              <label class="field-label">排序</label>
              <input
                v-model.number="formState.order"
                type="number"
                class="field-input"
                :disabled="isSaving"
              />
              <p class="field-hint">數字越小越前面</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <div class="actions-left">
            <NuxtLink to="/admin/projects" class="button button-secondary">
              <UIcon name="i-heroicons-arrow-left" />
              返回列表
            </NuxtLink>
          </div>

          <div class="actions-right">
            <button
              type="submit"
              class="button button-primary"
              :disabled="isSaving"
            >
              <UIcon v-if="isSaving" name="i-heroicons-arrow-path" class="animate-spin" />
              <UIcon v-else name="i-heroicons-check" />
              {{ isSaving ? '建立中...' : '建立作品' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </AdminLayout>
</template>

<style scoped>
/* Form Container */
.new-project-form {
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

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-grid.three-cols {
  grid-template-columns: repeat(3, 1fr);
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

.field-input-lg {
  font-size: 1.125rem;
  padding: 0.875rem 1rem;
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

/* Tags */
.tags-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #1d4ed8;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
}

.tag-remove:hover {
  color: #dc2626;
}

/* Switch */
.switch-field {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 28px;
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
  border-radius: 28px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
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

.switch-label {
  font-size: 0.9375rem;
  color: #475569;
  font-weight: 500;
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
  display: inline-flex;
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
  text-decoration: none;
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

/* Responsive */
@media (max-width: 768px) {
  .form-section {
    padding: 1.5rem;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-grid.three-cols {
    grid-template-columns: 1fr;
  }

  .form-field.full-width {
    grid-column: 1;
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

/* Cover Section */
.cover-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .cover-section {
    grid-template-columns: 1fr 1fr;
  }
}

.cover-upload-area {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cover-upload-area :deep(.cover-image-preview) {
  max-height: 300px;
  object-fit: cover;
  border-radius: 12px;
}

.cover-gradient-area {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.gradient-preview-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.gradient-preview {
  height: 120px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e5e7eb;
  background: #f8fafc;
}

.preview-placeholder {
  font-size: 0.875rem;
  color: #94a3b8;
}

/* Images Section */
.images-section {
  margin-top: 0.5rem;
}

.images-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 1.5rem;
}

.add-image-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
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
  padding: 4rem 2rem;
  text-align: center;
  background: #f8fafc;
  border: 2px dashed #e5e7eb;
  border-radius: 16px;
}

.empty-images .empty-icon {
  width: 56px;
  height: 56px;
  color: #cbd5e1;
  margin-bottom: 1rem;
}

.empty-images p {
  font-size: 0.9375rem;
  color: #94a3b8;
  margin: 0;
}

.images-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.image-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.image-item-number {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #475569;
}

.image-item-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.move-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
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
  width: 34px;
  height: 34px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
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
  padding: 1.25rem;
}

.image-upload-area {
  margin-bottom: 1.25rem;
}

.image-upload-area :deep(.project-image-preview) {
  max-height: 400px;
  object-fit: contain;
}

.image-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Select */
.field-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.9375rem;
  color: #0f172a;
  background: white;
  transition: all 0.3s;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 20px;
  padding-right: 44px;
}

.field-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-select:disabled {
  background-color: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}
</style>
