/**
 * MongoDB 資料庫輔助函數
 * 提供常用的資料庫操作方法
 */

import { ObjectId } from 'mongodb'
import { getCollection } from './db'
import type {
  ProfileDocument,
  ProjectDocument,
  SkillCategoryDocument,
  ContactDocument,
  COLLECTIONS
} from '~/app/types/database'

// ==================== Profile 相關 ====================

/**
 * 獲取啟用的個人資訊
 */
export async function getActiveProfile() {
  const collection = await getCollection<ProfileDocument>('profile')
  const profile = await collection.findOne({ isActive: true })

  if (!profile) {
    return null
  }

  // 移除 MongoDB 的 _id 和內部欄位
  const { _id, isActive, createdAt, updatedAt, ...profileData } = profile
  return profileData
}

// ==================== Projects 相關 ====================

/**
 * 獲取所有已發布的作品（用於列表）
 */
export async function getPublishedProjects() {
  const collection = await getCollection<ProjectDocument>('projects')

  const projects = await collection
    .find({ published: true })
    .sort({ order: 1 })
    .toArray()

  return projects.map(project => {
    const { _id, published, featured, createdAt, updatedAt, slug, metaDescription, metaKeywords, ...data } = project
    return {
      id: data.projectId,
      title: data.title,
      category: data.category,
      year: data.year,
      description: data.description,
      tags: data.tags,
      color: data.color
    }
  })
}

/**
 * 根據 projectId 獲取作品詳細資訊
 */
export async function getProjectById(projectId: string) {
  const collection = await getCollection<ProjectDocument>('projects')

  const project = await collection.findOne({
    projectId,
    published: true
  })

  if (!project) {
    return null
  }

  // 移除 MongoDB 的 _id 和內部欄位，並移除 order 排序
  const { _id, published, featured, order, createdAt, updatedAt, slug, metaDescription, metaKeywords, ...projectData } = project

  // 移除 images 和 results 的 order 欄位
  const cleanImages = projectData.images.map(({ order, ...img }) => img)
  const cleanResults = projectData.results.map(({ order, ...result }) => result)

  return {
    id: projectData.projectId,
    title: projectData.title,
    category: projectData.category,
    year: projectData.year,
    description: projectData.description,
    tags: projectData.tags,
    coverGradient: projectData.coverGradient,
    overview: projectData.overview,
    client: projectData.client,
    duration: projectData.duration,
    role: projectData.role,
    tools: projectData.tools,
    challenge: projectData.challenge,
    solution: projectData.solution,
    images: cleanImages,
    results: cleanResults
  }
}

/**
 * 獲取精選作品
 */
export async function getFeaturedProjects(limit: number = 3) {
  const collection = await getCollection<ProjectDocument>('projects')

  const projects = await collection
    .find({ published: true, featured: true })
    .sort({ order: 1 })
    .limit(limit)
    .toArray()

  return projects.map(project => {
    const { _id, published, featured, createdAt, updatedAt, slug, metaDescription, metaKeywords, ...data } = project
    return {
      id: data.projectId,
      title: data.title,
      category: data.category,
      year: data.year,
      description: data.description,
      tags: data.tags,
      color: data.color
    }
  })
}

/**
 * 根據分類獲取作品
 */
export async function getProjectsByCategory(category: string) {
  const collection = await getCollection<ProjectDocument>('projects')

  const projects = await collection
    .find({ published: true, category })
    .sort({ order: 1 })
    .toArray()

  return projects.map(project => {
    const { _id, published, featured, createdAt, updatedAt, ...data } = project
    return {
      id: data.projectId,
      title: data.title,
      category: data.category,
      year: data.year,
      description: data.description,
      tags: data.tags,
      color: data.color
    }
  })
}

/**
 * 根據標籤搜尋作品
 */
export async function getProjectsByTag(tag: string) {
  const collection = await getCollection<ProjectDocument>('projects')

  const projects = await collection
    .find({ published: true, tags: tag })
    .sort({ order: 1 })
    .toArray()

  return projects.map(project => {
    const { _id, published, featured, createdAt, updatedAt, ...data } = project
    return {
      id: data.projectId,
      title: data.title,
      category: data.category,
      year: data.year,
      description: data.description,
      tags: data.tags,
      color: data.color
    }
  })
}

// ==================== Skills 相關 ====================

/**
 * 獲取所有可見的技能分類
 */
export async function getVisibleSkills() {
  const collection = await getCollection<SkillCategoryDocument>('skills')

  const skills = await collection
    .find({ isVisible: true })
    .sort({ order: 1 })
    .toArray()

  return skills.map(skill => {
    const { _id, isVisible, createdAt, updatedAt, order, ...data } = skill
    return {
      id: data.categoryId,
      title: data.title,
      skills: data.skills
    }
  })
}

// ==================== Contact 相關 ====================

/**
 * 獲取啟用的聯絡資訊
 */
export async function getActiveContact() {
  const collection = await getCollection<ContactDocument>('contact')

  const contact = await collection.findOne({ isActive: true })

  if (!contact) {
    return null
  }

  // 移除 MongoDB 的 _id 和內部欄位，並移除 links 的 order
  const { _id, isActive, createdAt, updatedAt, ...contactData } = contact

  const cleanLinks = contactData.links
    .sort((a, b) => a.order - b.order)
    .map(({ order, icon, ...link }) => link)

  return {
    text: contactData.text,
    links: cleanLinks
  }
}

// ==================== 通用工具函數 ====================

/**
 * 檢查 ObjectId 是否有效
 */
export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id)
}

/**
 * 字串轉 ObjectId
 */
export function toObjectId(id: string): ObjectId {
  return new ObjectId(id)
}

/**
 * 更新時間戳記
 */
export function updateTimestamp() {
  return { updatedAt: new Date() }
}

/**
 * 創建時間戳記
 */
export function createTimestamp() {
  const now = new Date()
  return { createdAt: now, updatedAt: now }
}
