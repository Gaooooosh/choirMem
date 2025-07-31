# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个从基于 Flask 的合唱团乐谱共享平台迁移到 Next.js + Payload CMS 现代技术栈的项目。本项目是从 `npx create-payload-app` 创建的初始模板，需要根据旧项目（位于 `../choirMem`）的功能需求进行大幅改造，完成从旧项目到新的技术栈的彻底迁移。

### 迁移背景
- **旧项目位置**: `../choirMem` (基于 Flask 的北京邮电大学爱乐合唱团乐谱共享平台)
- **新项目目标**: 使用 Next.js + Payload CMS 重构，提供更现代的用户体验和管理界面
- **迁移计划**: 详见 `docs/refactor-plan.md`

## 旧项目架构分析 (../choirMem)

### 核心功能模块
旧项目是一个功能完整的合唱团管理系统，包含以下主要模块：

#### 1. 用户系统
- **认证**: Flask-Login + bcrypt 密码哈希
- **权限管理**: 基于 `PermissionGroup` 模型的角色权限系统
- **用户资料**: 头像、个人简介、活动分数统计
- **邀请码注册**: 通过邀请码控制用户注册

#### 2. 乐谱管理系统
- **曲目 (Track)**: 音乐作品的顶层实体
- **版本 (Version)**: 每个曲目的不同编排版本（如 SATB、无伴奏等）
- **乐谱文件 (Score)**: PDF 格式的乐谱上传
- **照片 (Photo)**: 演出相关的图片资料
- **标签系统**: 用于分类和检索
- **评分系统**: 用户可对版本难度进行评分
- **点赞功能**: 用户可点赞喜欢的版本

#### 3. 内容管理
- **文章系统**: 用户创作的内容管理
- **评论系统**: 针对曲目和版本的评论功能
- **乐集 (Collection)**: 用户创建的版本合集

#### 4. 特色功能
- **中文拼音排序**: 使用 pypinyin 实现正确的中文标题排序
- **AI 文本润色**: 集成阿里云 DashScope API 的文本优化功能
- **活动分数系统**: 根据用户贡献（上传、评论等）计算活动分数
- **数据备份**: 完整的数据库和文件备份恢复功能

### 旧项目文件结构
```
../choirMem/
├── app/
│   ├── models.py           # SQLAlchemy 数据模型
│   ├── routes.py          # 主要路由（登录、注册等）
│   ├── admin_routes.py    # 管理员功能路由
│   ├── track_routes.py    # 乐谱相关路由
│   ├── article_routes.py  # 文章功能路由
│   ├── profile_routes.py  # 用户资料路由
│   ├── collection_routes.py # 乐集功能路由
│   ├── api_routes.py      # AI 润色 API
│   └── templates/         # Jinja2 模板文件
├── config.py              # Flask 配置
├── init_db.py            # 数据库初始化
└── requirements.txt       # Python 依赖
```

## 新项目架构 (当前项目)

### 技术栈
- **Next.js 15**: App Router, SSR/SSG, Server Actions
- **React 19**: 最新并发特性
- **Payload CMS**: 无头 CMS，提供管理界面和 API
- **TypeScript**: 全栈类型安全
- **Tailwind CSS**: 实用优先的样式系统
- **SQLite/PostgreSQL**: 可配置的数据库选择

### 核心开发命令

#### 基础开发
```bash
# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start

# 生成 Payload 类型定义
pnpm generate:types

# 生成导入映射
pnpm generate:importmap
```

#### 代码质量
```bash
# 代码检查
pnpm lint

# 自动修复代码问题
pnpm lint:fix
```

#### 测试
```bash
# 运行所有测试
pnpm test

# 仅运行集成测试
pnpm test:int

# 仅运行端到端测试
pnpm test:e2e
```

#### 数据库管理
```bash
# 重置数据库并创建默认管理员用户
pnpm reset-db
```

**数据库重置脚本功能**:
- 删除现有的 SQLite 数据库文件 (`data.db`, `data.db-shm`, `data.db-wal`)
- 重新初始化 Payload CMS
- 创建默认管理员权限组（所有权限开启）
- 创建默认管理员用户：
  - 邮箱: `admin@example.com`
  - 密码: `admin123`
  - 用户名: `admin`
  - 姓名: `管理员`

**注意事项**:
- ⚠️ 该脚本会完全删除所有现有数据，请谨慎使用
- 🔒 生产环境部署前务必更改默认管理员密码
- 📁 脚本位置: `scripts/reset-db.ts`

## 迁移映射关系

### 数据模型映射
| 旧项目 (SQLAlchemy) | 新项目 (Payload Collections) | 文件位置 |
|-------------------|---------------------------|---------|
| User | Users (扩展现有) | `src/collections/Users/` |
| Track | Tracks | `src/collections/Tracks.ts` |
| Version | Versions | `src/collections/Versions.ts` |
| Score | Scores | `src/collections/Scores.ts` |
| Photo | Photos | `src/collections/Photos.ts` |
| Article | Articles | `src/collections/Articles.ts` |
| Collection | UserCollections | `src/collections/UserCollections.ts` |
| Tag | Tags | `src/collections/Tags.ts` |
| Comment | Comments | `src/collections/Comments.ts` |
| Rating | Ratings | `src/collections/Ratings.ts` |
| PermissionGroup | PermissionGroups | `src/collections/PermissionGroups.ts` |
| InvitationCode | InvitationCodes | `src/collections/InvitationCodes.ts` |
| SystemSetting | SystemSettings (Global) | `src/globals/SystemSettings.ts` |

### 路由映射
| 旧项目路由 | 新项目路由 | 说明 |
|----------|----------|-----|
| `/track/<slug>` | `/tracks/[slug]/page.tsx` | 曲目详情页 |
| `/version/<id>` | `/versions/[id]/page.tsx` | 版本详情页 |
| `/user/<username>` | `/profile/[username]/page.tsx` | 用户资料页 |
| `/articles` | `/articles/page.tsx` | 文章列表页 |
| `/article/<slug>` | `/articles/[slug]/page.tsx` | 文章详情页 |
| `/collections` | `/collections/page.tsx` | 乐集列表页 |

### 功能映射
| 旧项目功能 | 新项目实现方式 | 实现位置 |
|----------|-------------|---------|
| Flask 装饰器权限控制 | Payload Access Control | `src/access/` |
| SQLAlchemy 钩子 | Payload Hooks | 各 Collection 配置中 |
| Flask 路由逻辑 | Next.js Server Actions | `src/app/(frontend)/_actions/` |
| Jinja2 模板 | React 组件 | `src/components/` |
| 中文拼音排序 | beforeChange 钩子 | `src/collections/Tracks.ts` |
| AI 文本润色 | API 路由 + 系统配置 | `src/app/(payload)/api/ai-polish/` |

## 关键实现细节

### 权限系统迁移
旧项目的权限装饰器需要转换为 Payload 的访问控制函数：
```typescript
// src/access/hasPermission.ts
export const hasPermission = (permission: string): Access<any, User> => 
  ({ req: { user } }) => {
    if (!user) return false;
    if (user.is_admin) return true;
    return user.group?.[permission] || false;
  }
```

### 中文排序实现
需要在 Tracks 集合中添加 beforeChange 钩子，使用 pinyin 库生成排序键：
```typescript
// 在 src/collections/Tracks.ts 中
hooks: {
  beforeChange: [
    ({ data, operation }) => {
      if (data.title && (operation === 'create' || operation === 'update')) {
        data.title_sort = pinyin(data.title, { style: pinyin.STYLE_NORMAL }).join('');
      }
    }
  ]
}
```

### 数据迁移策略
1. **导出旧数据**: 从 `../choirMem/data.db` 导出 JSON 格式数据
2. **顺序导入**: Users → PermissionGroups → Tracks → Versions → Scores/Photos → Comments/Ratings
3. **文件迁移**: 复制 `../choirMem/uploads/` 到新项目的静态目录
4. **关联更新**: 确保外键关系正确映射

## 环境配置

必需的环境变量（参见 .env.example）：
- `DATABASE_URI`: 数据库连接字符串
- `PAYLOAD_SECRET`: JWT 加密密钥  
- `NEXT_PUBLIC_SERVER_URL`: 公共服务器 URL
- `CRON_SECRET`: 定时任务认证
- `PREVIEW_SECRET`: 预览模式验证

## 开发注意事项

### 快速开发阶段说明
- **当前阶段**: 项目处于快速开发迭代阶段，数据模式变化频繁
- **数据迁移策略**: 任何数据模式变更都不需要迁移现有数据，可以直接删除数据库重新开始
- **开发便利性**: 使用 `pnpm reset-db` 可以快速重置数据库并创建默认管理员用户
- **数据持久性**: 在此阶段，`data.db` 文件随时可以删除重新生成，无需担心数据丢失

### 现有模板清理
当前项目基于 Payload 网站模板，需要清理的内容：
- 删除不需要的默认 Collections (Pages, Posts)
- 保留 Media 集合但重命名为 Photos
- 删除默认的 Blocks 系统（不适用于我们的用例）
- 删除 SEO 插件配置（我们有自定义需求）

### 重要的迁移里程碑
1. **阶段一**: 实现核心 Collections 和数据模型
2. **阶段二**: 配置权限系统和访问控制
3. **阶段三**: 实现业务逻辑钩子
4. **阶段四**: 开发 React 前端界面
5. **阶段五**: 数据迁移和测试
6. **阶段六**: 部署和优化

### 参考文件
- **迁移详细计划**: `docs/refactor-plan.md`
- **旧项目文档**: `../choirMem/CLAUDE.md`
- **旧项目模型**: `../choirMem/app/models.py`
- **旧项目路由**: `../choirMem/app/*_routes.py`