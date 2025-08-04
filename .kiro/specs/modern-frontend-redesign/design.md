# 现代化前端重设计 - 设计文档

## Overview

本设计文档详细描述了将北邮爱乐合唱团乐谱共享平台从传统 Flask Bootstrap HTML 模板升级为基于 Next.js 15 + shadcn/ui + Tailwind CSS + Framer Motion 的现代化 React 前端的完整架构设计。该设计专注于创建一个视觉优雅、性能卓越、用户体验一流的内容展示平台，采用黑白灰的简洁配色和国际化设计标准。

## Architecture

### 项目结构架构

采用功能驱动的混合架构，结合 Next.js 15 App Router 的最佳实践：

```
src/
├── app/                                  # Next.js App Router 核心
│   ├── (payload)/                       # Payload CMS 自带后台 - 增强版
│   │   ├── admin/                       # Payload Admin UI (自动生成)
│   │   │   └── [[...segments]]/         # 动态路由
│   │   ├── api/                         # Payload 自动生成的 API
│   │   │   ├── [...slug]/route.ts       # 通用 API 路由
│   │   │   ├── graphql/route.ts         # GraphQL 端点
│   │   │   └── graphql-playground/      # GraphQL 调试工具
│   │   ├── custom.scss                  # Payload 管理界面自定义样式
│   │   └── layout.tsx                   # Payload 布局 (自动生成)
│   ├── (frontend)/                      # 路由组 - 用户界面
│   │   ├── tracks/                      # 曲目相关页面
│   │   │   ├── [slug]/
│   │   │   │   ├── page.tsx             # 曲目详情页
│   │   │   │   ├── loading.tsx          # 加载状态
│   │   │   │   └── error.tsx            # 错误页面
│   │   │   └── page.tsx                 # 曲目列表页
│   │   ├── versions/                    # 版本相关页面
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # 版本详情页
│   │   │       ├── edit/page.tsx        # 版本编辑页
│   │   │       └── upload/page.tsx      # 文件上传页
│   │   ├── profile/                     # 用户资料
│   │   │   ├── [username]/page.tsx      # 用户资料页
│   │   │   └── edit/page.tsx            # 编辑资料页
│   │   ├── articles/                    # 文章系统
│   │   │   ├── page.tsx                 # 文章列表
│   │   │   ├── [slug]/page.tsx          # 文章详情
│   │   │   └── create/page.tsx          # 创建文章
│   │   ├── collections/                 # 乐集功能
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── auth/                        # 认证页面
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── search/page.tsx              # 搜索页面
│   │   ├── page.tsx                     # 首页
│   │   └── layout.tsx                   # 前端布局
│   ├── api/                             # API 路由
│   │   ├── tracks/
│   │   │   ├── route.ts                 # 曲目 CRUD API
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── like/route.ts        # 点赞 API
│   │   │       └── comments/route.ts    # 评论 API
│   │   ├── versions/
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── scores/route.ts      # 乐谱上传 API
│   │   │       └── photos/route.ts      # 照片上传 API
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── logout/route.ts
│   │   ├── ai-polish/route.ts           # AI 润色 API
│   │   └── search/route.ts              # 搜索 API
│   ├── globals.css                      # 全局样式
│   └── layout.tsx                       # 根布局
├── components/                          # 组件系统
│   ├── ui/                             # shadcn/ui 基础组件
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── toast.tsx
│   │   └── ...                         # 其他 shadcn/ui 组件
│   ├── features/                       # 功能组件
│   │   ├── track/                      # 曲目相关组件
│   │   │   ├── TrackCard.tsx           # 曲目卡片
│   │   │   ├── TrackDetail.tsx         # 曲目详情
│   │   │   ├── TrackSearch.tsx         # 曲目搜索
│   │   │   ├── VersionList.tsx         # 版本列表
│   │   │   ├── DifficultyRating.tsx    # 难度评级
│   │   │   └── index.ts                # 导出文件
│   │   ├── version/                    # 版本相关组件
│   │   │   ├── VersionDetail.tsx       # 版本详情
│   │   │   ├── ScoreViewer.tsx         # 乐谱查看器
│   │   │   ├── PhotoGallery.tsx        # 照片画廊
│   │   │   ├── FileUpload.tsx          # 文件上传
│   │   │   └── index.ts
│   │   ├── user/                       # 用户相关组件
│   │   │   ├── UserProfile.tsx         # 用户资料
│   │   │   ├── UserAvatar.tsx          # 用户头像
│   │   │   ├── ActivityScore.tsx       # 活动分数
│   │   │   ├── UserTabs.tsx            # 用户标签页
│   │   │   └── index.ts
│   │   ├── article/                    # 文章相关组件
│   │   │   ├── ArticleCard.tsx         # 文章卡片
│   │   │   ├── ArticleEditor.tsx       # 文章编辑器
│   │   │   ├── ArticleReader.tsx       # 文章阅读器
│   │   │   └── index.ts
│   │   ├── collection/                 # 乐集相关组件
│   │   │   ├── CollectionCard.tsx
│   │   │   ├── CollectionDetail.tsx
│   │   │   └── index.ts
│   │   ├── auth/                       # 认证相关组件
│   │   │   ├── LoginForm.tsx           # 登录表单
│   │   │   ├── RegisterForm.tsx        # 注册表单
│   │   │   ├── AuthGuard.tsx           # 认证守卫
│   │   │   └── index.ts
│   │   └── comment/                    # 评论相关组件
│   │       ├── CommentList.tsx         # 评论列表
│   │       ├── CommentForm.tsx         # 评论表单
│   │       ├── CommentItem.tsx         # 评论项
│   │       └── index.ts
│   ├── layout/                         # 布局组件
│   │   ├── Header.tsx                  # 页面头部
│   │   ├── Footer.tsx                  # 页面底部
│   │   ├── Sidebar.tsx                 # 侧边栏
│   │   ├── Navigation.tsx              # 导航组件
│   │   ├── MobileMenu.tsx              # 移动端菜单
│   │   └── PayloadCustomizations.tsx   # Payload 界面定制组件
│   ├── common/                         # 通用组件
│   │   ├── Loading.tsx                 # 加载组件
│   │   ├── ErrorBoundary.tsx           # 错误边界
│   │   ├── InfiniteScroll.tsx          # 无限滚动
│   │   ├── MasonryGrid.tsx             # 瀑布流网格
│   │   ├── SearchBar.tsx               # 搜索栏
│   │   ├── Breadcrumb.tsx              # 面包屑导航
│   │   ├── FloatingActionButton.tsx    # 悬浮按钮
│   │   └── ThemeToggle.tsx             # 主题切换
│   └── music/                          # 音乐专用组件
│       ├── ScoreCard.tsx               # 乐谱卡片
│       ├── AudioPlayer.tsx             # 音频播放器
│       ├── VoicePartBadge.tsx          # 声部标识
│       ├── StaffLines.tsx              # 五线谱线条
│       └── TempoIndicator.tsx          # 节拍指示器
├── hooks/                              # 自定义 hooks
│   ├── useAuth.ts                      # 认证 hooks
│   ├── useApi.ts                       # API 请求 hooks
│   ├── useInfiniteScroll.ts            # 无限滚动 hooks
│   ├── useSearch.ts                    # 搜索 hooks
│   ├── useUpload.ts                    # 文件上传 hooks
│   ├── useLocalStorage.ts              # 本地存储 hooks
│   └── useDebounce.ts                  # 防抖 hooks
├── lib/                                # 工具库
│   ├── api.ts                          # API 客户端
│   ├── auth.ts                         # 认证工具
│   ├── utils.ts                        # 通用工具函数
│   ├── constants.ts                    # 常量定义
│   ├── validations.ts                  # 表单验证
│   └── animations.ts                   # 动画预设
├── types/                              # TypeScript 类型定义
│   ├── api.ts                          # API 类型
│   ├── components.ts                   # 组件类型
│   ├── music.ts                        # 音乐相关类型
│   ├── user.ts                         # 用户类型
│   └── index.ts                        # 类型导出
├── utils/                              # 工具函数
│   ├── cn.ts                           # className 合并
│   ├── formatters.ts                   # 格式化函数
│   ├── validators.ts                   # 验证函数
│   └── transformers.ts                 # 数据转换函数
└── styles/                             # 样式文件
    ├── components.css                  # 组件样式
    ├── animations.css                  # 动画样式
    └── music-theme.css                 # 音乐主题样式
```

### 技术栈架构决策

1. **前端框架**: Next.js 15 with App Router
2. **内容管理**: Payload CMS 3.49 (自带管理后台)
3. **UI 组件库**: shadcn/ui (基于 Radix UI)
4. **样式系统**: Tailwind CSS 3.4+
5. **动画库**: Framer Motion 12+
6. **状态管理**: React 19 内置状态 + Zustand (复杂状态)
7. **类型系统**: TypeScript 5.7 (严格模式)
8. **数据层**: Payload Collections + GraphQL/REST API
9. **图标**: Lucide React
10. **字体**: Geist Sans + Geist Mono

### Payload CMS 集成策略

#### 1. 管理界面架构
```typescript
// src/payload.config.ts 增强配置
export default buildConfig({
  admin: {
    components: {
      // 自定义登录前组件
      beforeLogin: ['/components/payload/BeforeLogin'],
      // 自定义仪表板组件
      beforeDashboard: ['/components/payload/CustomDashboard'],
      // 自定义导航组件
      Nav: '/components/payload/CustomNav',
      // 自定义图标和 Logo
      graphics: {
        Icon: '/components/payload/CustomIcon',
        Logo: '/components/payload/CustomLogo',
      },
      // 自定义页头组件
      header: ['/components/payload/CustomHeader'],
      // 自定义登出按钮
      logout: {
        Button: '/components/payload/CustomLogoutButton',
      }
    },
    // 自定义元数据
    meta: {
      titleSuffix: '- 北邮爱乐合唱团管理后台',
      favicon: '/favicon.ico',
      ogImage: '/opengraph-image.png',
    },
  },
  // 自定义端点
  endpoints: [
    {
      path: '/custom-dashboard-stats',
      method: 'get',
      handler: async (req) => {
        // 返回仪表板所需的统计数据
        const stats = await getDashboardStats(req.payload)
        return Response.json(stats)
      }
    }
  ],
  // 集合配置增强
  collections: [
    // 曲目集合定制
    {
      ...Tracks,
      admin: {
        ...Tracks.admin,
        // 自定义视图
        components: {
          views: {
            List: '/components/payload/tracks/CustomTracksList',
            Edit: {
              Default: '/components/payload/tracks/CustomTrackEdit',
            }
          },
          // 列表视图定制
          beforeList: ['/components/payload/tracks/TrackListHeader'],
          afterList: ['/components/payload/tracks/TrackListFooter'],
        }
      }
    },
    // 用户集合定制
    {
      ...Users,
      admin: {
        ...Users.admin,
        components: {
          views: {
            Edit: {
              Default: '/components/payload/users/CustomUserEdit',
            }
          }
        }
      }
    }
  ]
})
```

#### 2. Payload 界面定制组件
```typescript
// src/components/payload/CustomDashboard.tsx
'use client'

import React from 'react'
import { Banner } from '@payloadcms/ui'
import { DashboardStats } from './DashboardStats'

const CustomDashboard: React.FC = () => {
  return (
    <div className="custom-dashboard">
      <Banner type="success">
        <h2>欢迎来到北邮爱乐合唱团管理后台</h2>
        <p>在这里管理曲目、用户和系统设置</p>
      </Banner>
      <DashboardStats />
    </div>
  )
}

export default CustomDashboard

// src/components/payload/DashboardStats.tsx
'use client'

import React, { useEffect, useState } from 'react'
import './DashboardStats.scss'

interface Stats {
  trackCount: number
  activeUsers: number
  monthlyUploads: number
  totalScores: number
}

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/custom-dashboard-stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="loading">加载统计数据中...</div>
  }
  
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <h3>总曲目数</h3>
        <p className="stat-number">{stats?.trackCount || 0}</p>
      </div>
      <div className="stat-card">
        <h3>活跃用户</h3>
        <p className="stat-number">{stats?.activeUsers || 0}</p>
      </div>
      <div className="stat-card">
        <h3>本月上传</h3>
        <p className="stat-number">{stats?.monthlyUploads || 0}</p>
      </div>
      <div className="stat-card">
        <h3>乐谱文件</h3>
        <p className="stat-number">{stats?.totalScores || 0}</p>
      </div>
    </div>
  )
}

export { DashboardStats }
```

#### 3. 前端 API 集成
```typescript
// src/lib/payload-api.ts
import { getPayload } from 'payload'
import config from '@payload-config'

// 获取 Payload 实例
export const getPayloadClient = async () => {
  return await getPayload({ config })
}

// API 客户端类
export class PayloadAPIClient {
  private baseURL: string

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
  }

  // 获取曲目列表
  async getTracks(options: {
    page?: number
    limit?: number
    where?: any
    sort?: string
  } = {}) {
    const params = new URLSearchParams()
    if (options.page) params.set('page', options.page.toString())
    if (options.limit) params.set('limit', options.limit.toString())
    if (options.where) params.set('where', JSON.stringify(options.where))
    if (options.sort) params.set('sort', options.sort)

    const response = await fetch(`${this.baseURL}/tracks?${params}`)
    return response.json()
  }

  // 创建曲目
  async createTrack(data: any) {
    const response = await fetch(`${this.baseURL}/tracks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  // 获取用户统计
  async getUserStats(userId: string) {
    const response = await fetch(`${this.baseURL}/users/${userId}/stats`)
    return response.json()
  }

  // 上传文件
  async uploadFile(file: File, collection: string) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${this.baseURL}/${collection}`, {
      method: 'POST',
      body: formData
    })
    return response.json()
  }
}

// 默认客户端实例
export const payloadAPI = new PayloadAPIClient()
```

#### 4. 权限集成
```typescript
// src/access/adminOnly.ts
import { Access } from 'payload'

export const adminOnly: Access = ({ req }) => {
  return req.user?.is_admin || false
}

// src/access/ownerOrAdmin.ts
export const ownerOrAdmin: Access = ({ req }) => {
  if (req.user?.is_admin) return true
  
  return {
    or: [
      { creator: { equals: req.user?.id } },
      { uploader: { equals: req.user?.id } }
    ]
  }
}
```

#### 5. Payload 样式定制
```scss
// src/app/(payload)/custom.scss
@import '~@payloadcms/ui/scss';

// 自定义 CSS 变量
:root {
  --theme-bg: #fafafa;
  --theme-elevation-50: #ffffff;
  --theme-elevation-100: #f5f5f5;
  --theme-elevation-200: #e5e5e5;
  --theme-elevation-300: #d4d4d4;
  --theme-elevation-400: #a3a3a3;
  --theme-elevation-500: #737373;
  --theme-elevation-600: #525252;
  --theme-elevation-700: #404040;
  --theme-elevation-800: #262626;
  --theme-elevation-900: #171717;
  --theme-elevation-1000: #0a0a0a;
  
  // 音乐主题色彩
  --theme-success-50: #f0fdf4;
  --theme-success-500: #22c55e;
  --theme-success-900: #14532d;
  
  --theme-warning-50: #fffbeb;
  --theme-warning-500: #f59e0b;
  --theme-warning-900: #78350f;
  
  --theme-error-50: #fef2f2;
  --theme-error-500: #ef4444;
  --theme-error-900: #7f1d1d;
}

// 自定义仪表板样式
.custom-dashboard {
  padding: var(--gutter-h);
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--gutter-h);
    margin-top: var(--gutter-v);
    
    .stat-card {
      background: var(--theme-elevation-50);
      border: 1px solid var(--theme-elevation-200);
      border-radius: var(--border-radius-s);
      padding: var(--gutter-h);
      text-align: center;
      
      h3 {
        font-size: var(--font-size-sm);
        color: var(--theme-elevation-600);
        margin-bottom: var(--gutter-v-s);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .stat-number {
        font-size: 2rem;
        font-weight: 600;
        color: var(--theme-elevation-800);
        margin: 0;
      }
      
      &:hover {
        border-color: var(--theme-success-500);
        transform: translateY(-2px);
        transition: all 0.2s ease;
      }
    }
  }
  
  .loading {
    text-align: center;
    color: var(--theme-elevation-600);
    padding: var(--gutter-v);
  }
}

// 自定义 Payload 组件样式
.payload-custom-nav {
  .nav-item {
    &.music-section {
      border-left: 3px solid var(--theme-success-500);
      background: var(--theme-success-50);
    }
  }
}

// 响应式设计
@include mid-break {
  .custom-dashboard {
    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--gutter-h-s);
    }
  }
}
```

## Components and Interfaces

### 核心组件设计

#### 1. 布局组件系统

```typescript
// src/components/layout/Header.tsx
interface HeaderProps {
  variant?: 'default' | 'admin'
  user?: User | null
  transparent?: boolean
}

export const Header: React.FC<HeaderProps> = ({ 
  variant = 'default', 
  user, 
  transparent = false 
}) => {
  return (
    <motion.header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        transparent && "bg-transparent border-transparent"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container flex h-16 items-center justify-between">
        <Logo variant={variant} />
        <Navigation user={user} variant={variant} />
        <UserMenu user={user} />
      </div>
    </motion.header>
  )
}

// src/components/layout/Navigation.tsx
interface NavigationItem {
  label: string
  href: string
  icon?: LucideIcon
  badge?: string
  permission?: string
}

const navigationItems: NavigationItem[] = [
  { label: '首页', href: '/', icon: Home },
  { label: '曲库', href: '/tracks', icon: Music },
  { label: '文章', href: '/articles', icon: FileText },
  { label: '乐集', href: '/collections', icon: Library },
  { label: '名人堂', href: '/members', icon: Users },
]

export const Navigation: React.FC<NavigationProps> = ({ user, variant }) => {
  return (
    <nav className="hidden md:flex items-center space-x-6">
      {navigationItems.map((item, index) => (
        <NavigationLink
          key={item.href}
          href={item.href}
          icon={item.icon}
          badge={item.badge}
          className="relative"
        >
          {item.label}
          <motion.div
            className="absolute inset-0 bg-primary/10 rounded-md -z-10"
            initial={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
        </NavigationLink>
      ))}
    </nav>
  )
}
```

#### 2. 内容展示组件

```typescript
// src/components/features/track/TrackCard.tsx
interface TrackCardProps {
  track: Track
  layout?: 'grid' | 'list' | 'masonry'
  showDifficulty?: boolean
  showStats?: boolean
  interactive?: boolean
  onSelect?: (track: Track) => void
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  layout = 'grid',
  showDifficulty = true,
  showStats = true,
  interactive = true,
  onSelect
}) => {
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(track.likeCount || 0)

  return (
    <motion.article
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300",
        layout === 'list' && "flex items-center",
        layout === 'masonry' && "break-inside-avoid mb-4"
      )}
      layout
      layoutId={`track-${track.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -4, 
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)" 
      }}
      onClick={() => onSelect?.(track)}
    >
      {/* 背景渐变效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* 卡片内容 */}
      <div className="relative p-6 space-y-4">
        {/* 头部信息 */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {track.title}
            </h3>
            {track.composer && (
              <p className="text-sm text-muted-foreground mt-1">
                作曲: {track.composer}
              </p>
            )}
          </div>
          
          {showDifficulty && track.avgDifficulty && (
            <DifficultyRating
              value={track.avgDifficulty}
              count={track.ratingCount}
              size="sm"
            />
          )}
        </div>

        {/* 标签 */}
        {track.tags && track.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {track.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
            {track.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{track.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* 描述 */}
        {track.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {track.description}
          </p>
        )}

        {/* 底部统计和操作 */}
        {showStats && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center space-x-1">
                <Music className="w-4 h-4" />
                <span>{track.versionCount} 版本</span>
              </span>
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{track.commentCount}</span>
              </span>
            </div>

            {interactive && (
              <motion.button
                className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleLike()
                }}
              >
                <Heart 
                  className={cn("w-4 h-4", isLiked && "fill-red-500 text-red-500")} 
                />
                <span>{likeCount}</span>
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* 悬浮效果装饰 */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
        style={{
          background: "linear-gradient(135deg, rgba(var(--primary), 0.1) 0%, rgba(var(--secondary), 0.1) 100%)"
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.article>
  )
}
```

#### 3. 交互组件

```typescript
// src/components/features/version/ScoreViewer.tsx
interface ScoreViewerProps {
  scoreUrl: string
  title: string
  onDownload?: () => void
  onClose?: () => void
}

export const ScoreViewer: React.FC<ScoreViewerProps> = ({
  scoreUrl,
  title,
  onDownload,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [zoom, setZoom] = useState(100)

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="container mx-auto h-full flex flex-col">
        {/* 工具栏 */}
        <motion.div
          className="flex items-center justify-between p-4 bg-card border-b"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
        >
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>

          <div className="flex items-center space-x-2">
            {/* 缩放控制 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(50, zoom - 25))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(200, zoom + 25))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            {/* 下载按钮 */}
            <Button variant="default" size="sm" onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              下载
            </Button>
          </div>
        </motion.div>

        {/* PDF 查看器 */}
        <motion.div
          className="flex-1 relative overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">加载中...</p>
              </div>
            </div>
          )}

          <iframe
            src={scoreUrl}
            className="w-full h-full border-0"
            style={{ transform: `scale(${zoom / 100})` }}
            onLoad={() => setIsLoading(false)}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
```

#### 4. 瀑布流和无限滚动

```typescript
// src/components/common/MasonryGrid.tsx
interface MasonryGridProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  columns?: { sm: number; md: number; lg: number; xl: number }
  gap?: number
  hasNextPage?: boolean
  isLoading?: boolean
  onLoadMore?: () => void
}

export function MasonryGrid<T extends { id: string }>({
  items,
  renderItem,
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 16,
  hasNextPage = false,
  isLoading = false,
  onLoadMore
}: MasonryGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columnHeights, setColumnHeights] = useState<number[]>([])
  const [currentColumns, setCurrentColumns] = useState(columns.lg)

  // 响应式列数计算
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) setCurrentColumns(columns.sm)
      else if (width < 768) setCurrentColumns(columns.md)
      else if (width < 1024) setCurrentColumns(columns.lg)
      else setCurrentColumns(columns.xl)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [columns])

  // 无限滚动
  useInfiniteScroll({
    hasNextPage,
    isLoading,
    onLoadMore,
    rootMargin: '400px'
  })

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative"
        style={{
          columnCount: currentColumns,
          columnGap: `${gap}px`,
          columnFill: 'balance'
        }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            className="break-inside-avoid"
            style={{ marginBottom: `${gap}px` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.05,
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      )}

      {/* 无更多内容提示 */}
      {!hasNextPage && !isLoading && items.length > 0 && (
        <motion.div
          className="text-center py-8 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Music className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p>已显示全部内容</p>
        </motion.div>
      )}
    </div>
  )
}
```

## Data Models

### 前端数据模型

```typescript
// src/types/music.ts
export interface Track {
  id: string
  title: string
  slug: string
  description?: string
  composer?: string
  arranger?: string
  lyricist?: string
  createdAt: Date
  updatedAt: Date
  // 统计信息
  versionCount: number
  commentCount: number
  likeCount: number
  avgDifficulty?: number
  ratingCount: number
  // 关联数据
  tags: Tag[]
  versions: Version[]
  creator: User
}

export interface Version {
  id: string
  title: string
  notes?: string
  trackId: string
  creatorId: string
  createdAt: Date
  updatedAt: Date
  // 统计信息
  likeCount: number
  commentCount: number
  avgDifficulty?: number
  ratingCount: number
  // 关联数据
  track: Track
  creator: User
  tags: Tag[]
  scores: Score[]
  photos: Photo[]
  likes: User[]
  ratings: Rating[]
  comments: Comment[]
}

export interface Score {
  id: string
  description: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  versionId: string
  uploaderId: string
  createdAt: Date
  // 关联数据
  version: Version
  uploader: User
}

export interface Photo {
  id: string
  fileName: string
  filePath: string
  caption?: string
  alt?: string
  width: number
  height: number
  fileSize: number
  versionId?: string
  uploaderId: string
  createdAt: Date
  // 关联数据
  version?: Version
  uploader: User
}

export interface User {
  id: string
  username: string
  email: string
  name?: string
  bio?: string
  avatar?: Photo
  activityScore: number
  isAdmin: boolean
  groupId?: string
  createdAt: Date
  updatedAt: Date
  // 关联数据
  group?: PermissionGroup
  articles: Article[]
  scores: Score[]
  photos: Photo[]
  comments: Comment[]
  likedVersions: Version[]
  ratings: Rating[]
}

export interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  status: 'draft' | 'published'
  authorId: string
  coverImageId?: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  // 关联数据
  author: User
  coverImage?: Photo
  tags: Tag[]
}

export interface Comment {
  id: string
  body: string
  authorId: string
  trackId?: string
  versionId?: string
  createdAt: Date
  updatedAt: Date
  // 关联数据
  author: User
  track?: Track
  version?: Version
}

export interface Tag {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  createdAt: Date
  // 使用统计
  trackCount: number
  versionCount: number
  articleCount: number
}

export interface Rating {
  id: string
  difficulty: 1 | 2 | 3 | 4 | 5
  userId: string
  versionId: string
  createdAt: Date
  // 关联数据
  user: User
  version: Version
}

export interface PermissionGroup {
  id: string
  name: string
  description?: string
  permissions: Record<string, boolean>
  createdAt: Date
  updatedAt: Date
  // 关联数据
  users: User[]
}
```

### API 响应类型

```typescript
// src/types/api.ts
export interface ApiResponse<T = any> {
  data: T
  message: string
  status: 'success' | 'error'
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface SearchResponse<T> extends PaginatedResponse<T> {
  query: string
  filters: Record<string, any>
  facets: Record<string, FacetItem[]>
}

export interface FacetItem {
  value: string
  label: string
  count: number
}

// API 请求类型
export interface CreateTrackRequest {
  title: string
  description?: string
  composer?: string
  arranger?: string
  lyricist?: string
}

export interface UpdateTrackRequest extends Partial<CreateTrackRequest> {
  id: string
}

export interface CreateVersionRequest {
  title: string
  notes?: string
  trackId: string
  tagIds?: string[]
}

export interface UploadFileRequest {
  file: File
  description?: string
  versionId: string
}

export interface SearchRequest {
  query?: string
  filters?: {
    difficulty?: number[]
    tags?: string[]
    composer?: string[]
    dateRange?: [string, string]
  }
  sort?: 'relevance' | 'date' | 'popularity' | 'difficulty'
  page?: number
  pageSize?: number
}
```

## Error Handling

### 错误处理架构

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '认证失败') {
    super(message, 'AUTHENTICATION_ERROR', 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 'AUTHORIZATION_ERROR', 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源未找到') {
    super(message, 'NOT_FOUND_ERROR', 404)
  }
}
```

### 错误边界组件

```typescript
// src/components/common/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    // 这里可以添加错误报告服务
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} />
    }

    return this.props.children
  }
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <motion.div
    className="min-h-[400px] flex items-center justify-center p-8"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="text-center space-y-4 max-w-md">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-xl font-semibold">出现了一些问题</h2>
      <p className="text-muted-foreground">
        {error.message || '应用遇到了意外错误，请刷新页面重试。'}
      </p>
      <Button onClick={() => window.location.reload()}>
        刷新页面
      </Button>
    </div>
  </motion.div>
)
```

### API 错误处理

```typescript
// src/lib/api.ts
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new AppError(
          data.message || '请求失败',
          data.code || 'REQUEST_FAILED',
          response.status
        )
      }

      return data
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      // 网络错误或其他未知错误
      throw new AppError(
        '网络连接失败，请检查网络设置',
        'NETWORK_ERROR',
        0
      )
    }
  }

  // 便捷方法
  get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient('/api')
```

## Testing Strategy

### 测试架构

1. **单元测试**: 使用 Vitest + Testing Library
2. **集成测试**: API 路由和组件集成测试
3. **端到端测试**: Playwright 自动化测试
4. **视觉回归测试**: Chromatic 或类似工具
5. **性能测试**: Lighthouse CI

### 测试示例

```typescript
// src/components/features/track/TrackCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { TrackCard } from './TrackCard'

const mockTrack: Track = {
  id: '1',
  title: '测试曲目',
  composer: '测试作曲家',
  description: '这是一个测试曲目',
  versionCount: 2,
  commentCount: 5,
  likeCount: 10,
  avgDifficulty: 3.5,
  ratingCount: 4,
  tags: [{ id: '1', name: '古典', slug: 'classical' }],
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('TrackCard', () => {
  it('should render track information correctly', () => {
    render(<TrackCard track={mockTrack} />)
    
    expect(screen.getByText('测试曲目')).toBeInTheDocument()
    expect(screen.getByText('作曲: 测试作曲家')).toBeInTheDocument()
    expect(screen.getByText('2 版本')).toBeInTheDocument()
    expect(screen.getByText('古典')).toBeInTheDocument()
  })

  it('should call onSelect when clicked', async () => {
    const onSelect = vi.fn()
    render(<TrackCard track={mockTrack} onSelect={onSelect} />)
    
    fireEvent.click(screen.getByRole('article'))
    
    await waitFor(() => {
      expect(onSelect).toHaveBeenCalledWith(mockTrack)
    })
  })

  it('should handle like button click', async () => {
    render(<TrackCard track={mockTrack} interactive />)
    
    const likeButton = screen.getByRole('button', { name: /10/ })
    fireEvent.click(likeButton)
    
    // 验证点赞逻辑
    await waitFor(() => {
      expect(screen.getByText('11')).toBeInTheDocument()
    })
  })
})
```

### 端到端测试

```typescript
// tests/e2e/track-management.spec.ts
import { test, expect } from '@playwright/test'

test.describe('曲目管理', () => {
  test.beforeEach(async ({ page }) => {
    // 登录管理员账户
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/')
  })

  test('should create a new track', async ({ page }) => {
    await page.goto('/tracks')
    await page.click('text=创建新曲目')
    
    await page.fill('[name="title"]', '测试曲目')
    await page.fill('[name="composer"]', '测试作曲家')
    await page.fill('[name="description"]', '这是一个测试曲目的描述')
    
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL(/\/tracks\/[a-z0-9-]+/)
    await expect(page.locator('h1')).toContainText('测试曲目')
  })

  test('should upload and preview score', async ({ page }) => {
    await page.goto('/tracks/test-track')
    await page.click('text=添加新版本')
    
    await page.fill('[name="title"]', '测试版本')
    await page.click('button[type="submit"]')
    
    // 上传乐谱文件
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('tests/fixtures/test-score.pdf')
    await page.fill('[name="description"]', '测试乐谱')
    await page.click('text=上传')
    
    // 预览乐谱
    await page.click('text=预览')
    await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible()
  })
})
```

## 关键设计决策总结

1. **架构选择**: 采用功能驱动的组件架构，便于维护和扩展
2. **状态管理**: 使用 React 19 内置状态 + 必要时的 Zustand
3. **样式系统**: shadcn/ui + Tailwind CSS，确保一致性和可定制性
4. **动画策略**: Framer Motion，注重性能和可访问性
5. **错误处理**: 完整的错误边界和用户友好的错误提示
6. **类型安全**: 严格的 TypeScript 配置，完整的类型定义
7. **测试策略**: 多层次测试，确保代码质量和用户体验
8. **性能优化**: 组件懒加载、图片优化、无限滚动等

这个设计架构将为合唱团平台提供现代、高性能且易于维护的前端基础，同时保持了优雅的用户体验和强大的功能性。