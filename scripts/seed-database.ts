/**
 * MongoDB 資料庫種子資料腳本
 *
 * 執行方式：
 * npx tsx scripts/seed-database.ts
 */

import { MongoClient, ObjectId } from 'mongodb'
import type {
  ProfileDocument,
  ProjectDocument,
  SkillCategoryDocument,
  ContactDocument,
  COLLECTIONS
} from '../app/types/database'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongo:ODQjuNrA0Zk14vzEFc95UJ73fK2pLm86@sjc1.clusters.zeabur.com:20373'
const DATABASE_NAME = 'zeabur'

async function seedDatabase() {
  console.log('🌱 開始初始化資料庫...\n')

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log('✅ MongoDB 連線成功\n')

    const db = client.db(DATABASE_NAME)

    // ==================== 清空現有資料 ====================
    console.log('🗑️  清空現有資料...')
    await db.collection('profile').deleteMany({})
    await db.collection('projects').deleteMany({})
    await db.collection('skills').deleteMany({})
    await db.collection('contact').deleteMany({})
    console.log('✅ 資料清空完成\n')

    // ==================== Profile ====================
    console.log('📝 建立個人資訊...')
    const profileData: Omit<ProfileDocument, '_id'> = {
      name: '李松年',
      nameEn: 'Lee Song-Nian',
      title: 'UI/UX Designer',
      bio: [
        '我是李松年,一位專注於創造直覺、優雅數位體驗的 UI/UX 設計師。',
        '在過去的設計生涯中,我始終相信好的設計不僅是視覺上的美觀,更重要的是能夠解決真實的問題,為使用者創造價值。我擅長將複雜的需求轉化為簡潔、易用的介面,並透過細膩的互動設計提升使用者體驗。',
        '我的設計哲學是:少即是多。透過精準的設計語言和克制的視覺表達,讓產品的本質自然浮現。'
      ],
      philosophy: '少即是多',
      photo: '/profile.jpg',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    await db.collection('profile').insertOne(profileData)
    console.log('✅ 個人資訊已建立\n')

    // ==================== Projects ====================
    console.log('📁 建立作品資料...')
    const projectsData: Omit<ProjectDocument, '_id'>[] = [
      {
        projectId: 'fintech-app',
        slug: 'fintech-app',
        title: '金融科技應用重設計',
        category: 'Mobile App',
        year: '2025',
        description: '重新設計投資理財應用程式,提升使用者投資決策效率',
        tags: ['UX Research', 'UI Design', 'Prototyping'],
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        overview: '這是一個針對年輕投資族群設計的理財應用程式。原有介面複雜且資訊過載,導致使用者難以快速做出投資決策。透過深入的使用者研究和多次迭代,我們重新設計了整體體驗,將複雜的金融資訊轉化為直覺易懂的視覺呈現。',
        client: '某金融科技公司',
        duration: '4 個月',
        role: '主導 UI/UX 設計',
        tools: 'Figma, Principle, After Effects',
        challenge: '原應用程式的主要問題在於資訊架構混亂,使用者需要點擊多層才能查看重要資訊。此外,大量的專業術語和數據讓新手投資者感到困惑,導致轉換率低落。',
        solution: '我們採用卡片式設計系統,將資訊分層呈現,讓使用者可以快速掌握關鍵數據。同時引入視覺化圖表和顏色編碼系統,降低理解門檻。透過簡化操作流程,將投資流程從原本的 7 步驟縮減至 3 步驟。',
        images: [
          {
            layout: 'full',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            label: '首頁設計',
            caption: '清晰的資訊層級和視覺化數據呈現',
            order: 1
          },
          {
            layout: 'half',
            gradient: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
            label: '投資組合',
            caption: '直覺的投資組合管理介面',
            order: 2
          },
          {
            layout: 'half',
            gradient: 'linear-gradient(135deg, #667eea 30%, #764ba2 100%)',
            label: '交易流程',
            caption: '簡化的交易操作流程',
            order: 3
          },
          {
            layout: 'full',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            label: '數據視覺化',
            caption: '互動式圖表讓數據更易理解',
            order: 4
          }
        ],
        results: [
          { value: '+40%', label: '轉換率提升', order: 1 },
          { value: '+65%', label: '使用者滿意度', order: 2 },
          { value: '-50%', label: '操作步驟減少', order: 3 },
          { value: '4.8/5', label: 'App Store 評分', order: 4 }
        ],
        published: true,
        featured: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        projectId: 'design-system',
        slug: 'design-system',
        title: '企業級設計系統',
        category: 'Design System',
        year: '2025',
        description: '建立可擴展的設計系統,統一多平台的使用者體驗',
        tags: ['Design System', 'Component Library', 'Documentation'],
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        coverGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        overview: '為一家大型企業建立完整的設計系統,涵蓋 Web、iOS 和 Android 三個平台。這個設計系統不僅統一了視覺語言,更建立了清晰的設計流程和開發規範,大幅提升團隊協作效率。',
        client: '某科技企業',
        duration: '6 個月',
        role: '設計系統負責人',
        tools: 'Figma, Storybook, Zeroheight',
        challenge: '公司產品線眾多,各團隊使用不同的設計規範,導致使用者體驗不一致。設計師和工程師之間的溝通成本高,重複造輪子的情況嚴重。',
        solution: '建立了包含 150+ 組件的設計系統,涵蓋基礎元件、複合組件和業務組件。透過詳細的使用指南和程式碼範例,確保團隊能夠正確使用。同時建立設計 Token 系統,實現主題切換和品牌客製化。',
        images: [
          {
            layout: 'full',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            label: '設計原則',
            caption: '清晰的設計原則指導整個系統',
            order: 1
          },
          {
            layout: 'half',
            gradient: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
            label: '基礎組件',
            caption: '可重用的基礎組件庫',
            order: 2
          },
          {
            layout: 'half',
            gradient: 'linear-gradient(135deg, #f093fb 30%, #f5576c 100%)',
            label: 'Design Tokens',
            caption: '系統化的設計參數管理',
            order: 3
          },
          {
            layout: 'full',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            label: '文檔系統',
            caption: '完整的使用文檔和範例',
            order: 4
          }
        ],
        results: [
          { value: '150+', label: '組件數量', order: 1 },
          { value: '-60%', label: '設計時間減少', order: 2 },
          { value: '95%', label: '團隊採用率', order: 3 },
          { value: '3x', label: '開發效率提升', order: 4 }
        ],
        published: true,
        featured: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        projectId: 'ecommerce-platform',
        slug: 'ecommerce-platform',
        title: '電商平台體驗優化',
        category: 'Web Platform',
        year: '2024',
        description: '透過數據分析與使用者研究,提升轉換率 40%',
        tags: ['UX Design', 'A/B Testing', 'Analytics'],
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        coverGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        overview: '針對一個中型電商平台進行全面的使用者體驗優化。透過數據分析發現關鍵問題,並透過 A/B 測試驗證設計假設,最終實現轉換率的顯著提升。',
        client: '某電商平台',
        duration: '3 個月',
        role: 'UX 設計師',
        tools: 'Figma, Google Analytics, Hotjar',
        challenge: '平台的購物車放棄率高達 70%,結帳流程冗長,且行動裝置體驗不佳。使用者反映找不到想要的商品,搜尋功能效果差。',
        solution: '重新設計結帳流程,從 6 步驟簡化為 3 步驟,並加入訪客結帳選項。優化搜尋功能,加入智能推薦和篩選器。針對行動裝置優化觸控體驗,增大點擊區域並簡化導航。',
        images: [
          {
            layout: 'full',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            label: '首頁優化',
            caption: '更清晰的產品展示和導航',
            order: 1
          },
          {
            layout: 'half',
            gradient: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
            label: '搜尋功能',
            caption: '智能搜尋和推薦系統',
            order: 2
          },
          {
            layout: 'half',
            gradient: 'linear-gradient(135deg, #4facfe 30%, #00f2fe 100%)',
            label: '產品頁面',
            caption: '優化的產品資訊呈現',
            order: 3
          },
          {
            layout: 'full',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            label: '結帳流程',
            caption: '簡化的結帳體驗',
            order: 4
          }
        ],
        results: [
          { value: '+40%', label: '轉換率提升', order: 1 },
          { value: '-30%', label: '購物車放棄率降低', order: 2 },
          { value: '+55%', label: '行動裝置訂單', order: 3 },
          { value: '2.5 分鐘', label: '平均結帳時間', order: 4 }
        ],
        published: true,
        featured: false,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        projectId: 'health-app',
        slug: 'health-app',
        title: '健康管理應用',
        category: 'Mobile App',
        year: '2024',
        description: '設計直覺的健康追蹤介面,幫助使用者養成健康習慣',
        tags: ['UI Design', 'Interaction Design', 'User Research'],
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        coverGradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        overview: '為健康管理應用設計全新的使用者介面,專注於提升使用者的長期參與度。透過遊戲化設計和社群功能,鼓勵使用者養成健康的生活習慣。',
        client: '某健康科技新創',
        duration: '5 個月',
        role: '主導 UI/UX 設計',
        tools: 'Figma, ProtoPie, Sketch',
        challenge: '使用者通常在下載後的第一週非常活躍,但之後參與度急劇下降。如何維持長期使用是最大的挑戰。',
        solution: '引入遊戲化元素,包括成就系統、挑戰和排行榜。設計簡單但有意義的互動,讓記錄健康數據變得輕鬆有趣。加入社群功能,讓使用者可以與朋友一起設定目標。',
        images: [
          {
            layout: 'full',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            label: '儀表板',
            caption: '清晰的健康數據總覽',
            order: 1
          },
          {
            layout: 'half',
            gradient: 'linear-gradient(135deg, #38f9d7 0%, #43e97b 100%)',
            label: '活動追蹤',
            caption: '直覺的活動記錄介面',
            order: 2
          },
          {
            layout: 'half',
            gradient: 'linear-gradient(135deg, #43e97b 30%, #38f9d7 100%)',
            label: '成就系統',
            caption: '遊戲化的激勵機制',
            order: 3
          },
          {
            layout: 'full',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            label: '社群功能',
            caption: '與朋友一起達成健康目標',
            order: 4
          }
        ],
        results: [
          { value: '+120%', label: '30 天留存率', order: 1 },
          { value: '+85%', label: '每日活躍用戶', order: 2 },
          { value: '4.7/5', label: '使用者評分', order: 3 },
          { value: '75%', label: '目標達成率', order: 4 }
        ],
        published: true,
        featured: false,
        order: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    await db.collection('projects').insertMany(projectsData)
    console.log(`✅ 已建立 ${projectsData.length} 個作品\n`)

    // ==================== Skills ====================
    console.log('🎯 建立技能資料...')
    const skillsData: Omit<SkillCategoryDocument, '_id'>[] = [
      {
        categoryId: 'design-expertise',
        title: '設計專長',
        skills: [
          '使用者體驗設計 (UX Design)',
          '介面設計 (UI Design)',
          '互動原型設計 (Prototyping)',
          '設計系統 (Design System)',
          '使用者研究 (User Research)'
        ],
        order: 1,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        categoryId: 'design-tools',
        title: '設計工具',
        skills: [
          'Figma',
          'Adobe Creative Suite',
          'Principle',
          'ProtoPie',
          'Framer'
        ],
        order: 2,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    await db.collection('skills').insertMany(skillsData)
    console.log(`✅ 已建立 ${skillsData.length} 個技能分類\n`)

    // ==================== Contact ====================
    console.log('📧 建立聯絡資訊...')
    const contactData: Omit<ContactDocument, '_id'> = {
      text: '對於合作機會或設計諮詢,歡迎隨時與我聯繫。',
      links: [
        {
          id: 'email',
          label: 'Email',
          value: 'lee.songnian@example.com',
          url: 'mailto:lee.songnian@example.com',
          order: 1
        },
        {
          id: 'linkedin',
          label: 'LinkedIn',
          value: 'linkedin.com/in/leesongnian',
          url: 'https://linkedin.com/in/leesongnian',
          order: 2
        },
        {
          id: 'dribbble',
          label: 'Dribbble',
          value: 'dribbble.com/leesongnian',
          url: 'https://dribbble.com/leesongnian',
          order: 3
        },
        {
          id: 'behance',
          label: 'Behance',
          value: 'behance.net/leesongnian',
          url: 'https://behance.net/leesongnian',
          order: 4
        }
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    await db.collection('contact').insertOne(contactData)
    console.log('✅ 聯絡資訊已建立\n')

    // ==================== 建立索引 ====================
    console.log('🔍 建立資料庫索引...')

    // Profile 索引
    await db.collection('profile').createIndex({ isActive: 1 })

    // Projects 索引
    await db.collection('projects').createIndex({ projectId: 1 }, { unique: true })
    await db.collection('projects').createIndex({ slug: 1 }, { unique: true })
    await db.collection('projects').createIndex({ published: 1, order: 1 })
    await db.collection('projects').createIndex({ featured: 1, published: 1 })
    await db.collection('projects').createIndex({ tags: 1 })
    await db.collection('projects').createIndex({ category: 1 })

    // Skills 索引
    await db.collection('skills').createIndex({ categoryId: 1 }, { unique: true })
    await db.collection('skills').createIndex({ order: 1, isVisible: 1 })

    // Contact 索引
    await db.collection('contact').createIndex({ isActive: 1 })

    console.log('✅ 索引建立完成\n')

    // ==================== 驗證資料 ====================
    console.log('✅ 驗證資料...')
    const profileCount = await db.collection('profile').countDocuments()
    const projectsCount = await db.collection('projects').countDocuments()
    const skillsCount = await db.collection('skills').countDocuments()
    const contactCount = await db.collection('contact').countDocuments()

    console.log(`  - Profile: ${profileCount} 筆`)
    console.log(`  - Projects: ${projectsCount} 筆`)
    console.log(`  - Skills: ${skillsCount} 筆`)
    console.log(`  - Contact: ${contactCount} 筆`)

    console.log('\n' + '='.repeat(60))
    console.log('🎉 資料庫初始化完成！')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ 錯誤:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

// 執行腳本
seedDatabase()
