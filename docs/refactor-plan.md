# 迁移计划：从 Flask 到 Next.js & Payload CMS

本文档概述了将基于 Flask 的合唱团曲库项目（位于 `../choirMem` ）迁移到使用 Next.js (前端) 和 Payload (无头 CMS 后端) 的现代技术栈（本项目）所需的详细步骤。该计划分为几个不同阶段，从数据建模开始，到前端实现和数据迁移结束。

## 第一阶段：后端 - 在 Payload 中复制数据结构 ✅

第一步也是最关键的一步，是将您的 SQLAlchemy 模型转换为 Payload 的集合（Collections）和全局变量（Globals）。这将构成新的数据基础。所有的集合配置文件都已在 `src/collections/` 目录下创建。

### 1.1. 核心内容集合

这些集合直接对应于您 Flask 应用中的主要实体。

1. 曲目 (Tracks) (src/collections/Tracks.ts)

这将是音乐作品的顶层实体。

- **字段:**
  - `title` (`text`, 必需)
  - `description` (`richText`)
- 版本 (Versions) (src/collections/Versions.ts)

此集合将与 Tracks 建立关联。

- **字段:**
  - `title` (`text`, 必需): 例如，"SATB 无伴奏合唱版"。
  - `notes` (`richText`): 用于记录版本特定的细节。
  - `track` (`relationship`, 必需, to: 'tracks'): 所属的父级曲目。
  - `creator` (`relationship`, 必需, to: 'users'): 创建此版本的用户。
  - `tags` (`relationship`, hasMany, to: 'tags')
  - `likes` (`relationship`, hasMany, to: 'users'): 用于存储用户的"喜欢"。我们将从管理界面隐藏此字段，并通过钩子或端点进行管理。
  - `avg_difficulty` (`number`, admin.readOnly): 将通过钩子计算得出。
- 乐谱 (Scores) (src/collections/Scores.ts)

这将是一个用于上传 PDF 文件的 upload 集合。

- **字段:**
  - `description` (`text`, 必需): 例如，"总谱"、"女高音声部谱"。
  - `version` (`relationship`, 必需, to: 'versions'): 此乐谱所属的版本。
  - `uploader` (`relationship`, 必需, to: 'users')。
- **上传配置:** 启用 `staticDir` 来存储文件，并配置为只接受 PDF 文件。
- 媒体 (Media) (src/collections/Media.ts)

这将是用于处理图片文件的 upload 集合，替代原来的Photos集合。

- **字段:**
  - `alt` (`text`, 必需): 用于无障碍访问。
  - `caption` (`richText`)。
  - `version` (`relationship`, to: 'versions'): 将照片关联到特定的演出版本。
  - `uploader` (`relationship`, 必需, to: 'users')。
- **上传配置:** 配置 `imageSizes` 以生成必要的缩略图。
- 文章 (Articles) (src/collections/Articles.ts)

用于用户创作的内容。

- **字段:**
  - `title` (`text`, 必需)。
  - `body` (`richText`, 必需)。
  - `author` (`relationship`, 必需, to: 'users')。
  - `publishedAt` (`date`)。
- 乐集 (UserCollections) (src/collections/UserCollections.ts)

用于用户创建的版本合集。

- **字段:**
  - `name` (`text`, 必需)。
  - `description` (`richText`)。
  - `creator` (`relationship`, 必需, to: 'users')。
  - `versions` (`relationship`, hasMany, to: 'versions')。

### 1.2. 辅助与分类集合

这些集合用于组织核心内容并为其添加元数据。

**1. 标签 (Tags) (`src/collections/Tags.ts`)**

- **字段:**
  - `name` (`text`, 必需, 唯一)。

**2. 评论 (Comments) (`src/collections/Comments.ts`)**

- **字段:**
  - `body` (`textarea`, 必需)。
  - `author` (`relationship`, 必需, to: 'users')。
  - `track` (`relationship`, to: 'tracks')。
  - `version` (`relationship`, to: 'versions')。
  - *注意:* 添加一个钩子来验证 `track` 或 `version` 字段必须有一个被填充，但不能两者都被填充。
- 评分 (Ratings) (src/collections/Ratings.ts)

此集合将存储用户对版本的评分。

- **字段:**
  - `user` (`relationship`, 必需, to: 'users')。
  - `version` (`relationship`, 必需, to: 'versions')。
  - `difficulty` (`number`, 必需, min: 1, max: 5)。
- **管理界面:** 在 `['user', 'version']` 上设置唯一索引，以确保每个用户对每个版本只能评分一次。

### 1.3. 用户与系统集合

这些用于管理用户、权限和系统范围的设置。

1. 用户 (Users) (src/collections/Users/index.ts) - 修改现有

自定义现有的 Users 集合。

- **新增字段:**
  - `username` (`text`, 必需, 唯一)。
  - `group` (`relationship`, to: 'permission-groups')。
  - `avatar` (`upload`, relationTo: 'media')。
  - `bio` (`richText`)。
  - `activity_score` (`number`, admin.readOnly)。

**2. 权限组 (PermissionGroups) (`src/collections/PermissionGroups.ts`)**

- **字段:**
  - `name` (`text`, 必需, 唯一)。
  - `can_view_scores` (`checkbox`)。
  - `can_upload_scores` (`checkbox`)。
  - `can_upload_photos` (`checkbox`)。
  - `can_post_comments` (`checkbox`)。
  - `can_create_tracks` (`checkbox`)。

**3. 邀请码 (InvitationCodes) (`src/collections/InvitationCodes.ts`)**

- **字段:**
  - `code` (`text`, 必需, 唯一)。
  - `group` (`relationship`, 必需, to: 'permission-groups')。
  - `total_uses` (`number`)。
  - `uses_left` (`number`)。

### 1.4. 系统全局变量

Flask 中的 `SystemSetting` 模型最适合用 Payload 的 **全局变量 (Global)** 来实现。

**1. 系统设置 (SystemSettings) (`src/globals/SystemSettings.ts`)**

- **字段:**
  - `registration_enabled` (`checkbox`)。
  - `homepage_photo_max` (`number`)。
  - `ai_polish_prompt` (`textarea`)。

创建完这些文件后，请记得将它们添加到您的 `src/payload.config.ts` 文件的 `collections` 和 `globals` 数组中。

✅ **第一阶段所有任务已完成**
- 所有集合和全局变量已创建
- 所有集合已添加到payload.config.ts
- 类型定义已重新生成
- 服务器已成功启动并运行

## 第二阶段：实现访问控制

✅ **第二阶段所有任务已完成**
- 已为所有集合和全局变量配置访问控制
- 已创建和配置访问控制辅助函数

Payload 的访问控制功能是您 Flask 装饰器的直接替代品。您将主要在 `src/access/` 目录中定义它们。

1. 使用Payload内置权限管理：

Payload CMS 提供了内置的权限管理功能，我们将使用这些功能替代自定义的PermissionGroups实现。

- **用户角色管理**: 使用Payload内置的用户角色系统
- **权限控制**: 通过Payload的访问控制API实现细粒度权限控制
- **认证**: 使用Payload内置的认证机制

2. 创建一个集中的权限检查器：

创建一个辅助函数，用于根据所需权限检查用户的权限组。

```
// src/access/hasPermission.ts
import { Access } from 'payload';
import { User } from '../payload-types';

export const hasPermission = (permission: string): Access<any, User> => ({ req: { user } }) => {
  if (!user) {
    return false;
  }

  if (user.is_admin) {
    return true;
  }

  if (user.group && typeof user.group === 'object') {
    return user.group[permission] || false;
  }

  return false;
}
```

2. 将访问控制应用于集合：

在您的集合配置中使用此辅助函数。例如，在 src/collections/Scores.ts 中：

```
// ...
import { hasPermission } from '../access/hasPermission';
import { authenticated } from '../access/authenticated';

export const Scores: CollectionConfig = {
  slug: 'scores',
  access: {
    create: hasPermission('can_upload_scores'),
    read: hasPermission('can_view_scores'),
    update: authenticated, // 或更具体的检查
    delete: authenticated, // 或更具体的检查
  },
  // ...
}
```

## 第三阶段：使用钩子复制业务逻辑

✅ **第三阶段所有任务已完成**
- 已为所有需要的集合配置访问控制钩子
- 已创建和配置所有访问控制辅助函数
- 已实现TrackVersions平均难度动态计算功能
- 已实现Scores、TrackVersions和Comments集合的活动分数动态计算功能
- 已将TrackVersionRatings合并到TrackVersions集合中
- 服务器已成功重启并运行

## 第四阶段：当前状态分析与下一步计划

✅ **第四阶段所有任务已完成**
- 已成功将TrackVersionRatings合并到TrackVersions集合中
- 已修复updateRatings.ts中的类型错误
- 已重启开发服务器并验证功能正常

## 第五阶段：完善权限管理功能

✅ **第五阶段所有任务已完成**
- 已在PermissionGroups集合中添加更多权限字段
- 已在Users集合中添加is_admin字段
- 已更新权限检查器以正确处理管理员权限
- 已为Users和InvitationCodes集合添加访问控制
- 已重新生成类型定义并重启开发服务器

## 第四阶段：当前状态分析与下一步计划

### 4.1. 当前状态分析

根据对现有Payload项目的分析，大部分核心数据模型已经实现，但与旧Flask项目相比仍有一些差异。

#### 4.1.1. 已实现的模型映射

| Flask模型 | Payload集合 | 状态 | 备注 |
|-----------|-------------|------|------|
| User | Users | ✅ 已实现 | 字段略有差异 |
| PermissionGroup | PermissionGroups | ✅ 已实现 | 字段基本一致 |
| Track | Tracks | ✅ 已实现 | 字段基本一致 |
| Version | TrackVersions | ✅ 已实现 | 名称略有差异 |
| Score | Scores | ✅ 已实现 | 字段基本一致 |
| Comment | Comments | ✅ 已实现 | 字段基本一致 |
| Tag | Tags | ✅ 已实现 | 字段基本一致 |
| Rating | TrackVersions.ratings | ✅ 已重构 | 已将TrackVersionRatings合并到TrackVersions集合中 |
| Collection | UserCollections | ✅ 已实现 | 名称略有差异 |
| InvitationCode | InvitationCodes | ✅ 已实现 | 字段基本一致 |
| SystemSetting | SystemSettings | ✅ 已实现 | 字段略有差异 |
| Photo | Media | ✅ 已实现 | 已合并到Media集合 |
| Article | Articles | 🔄 待实现 | 需要创建Articles集合 |

#### 4.1.2. 缺失的模型

以下模型在旧Flask项目中存在，但在新的Payload项目中尚未实现：

1. **Article** - 署名文章模型

#### 4.1.3. 模型字段差异

##### Users模型差异

| Flask字段 | Payload字段 | 差异说明 |
|------------|-------------|----------|
| username | username | 基本一致 |
| password_hash | (内置) | Payload使用内置认证 |
| is_admin | (通过PermissionGroup) | 权限控制方式不同 |
| group_id | group | 关系字段命名不同 |
| avatar_filename | avatar | 字段类型不同（关系vs文件） |
| bio | bio | 基本一致 |
| activity_score | activity_score | 基本一致 |
| last_seen | (通过timestamps) | Payload使用内置时间戳 |

##### SystemSettings模型差异

| Flask字段 | Payload字段 | 差异说明 |
|------------|-------------|----------|
| key/value存储 | 具体字段 | 实现方式不同 |
| registration_enabled | registration_enabled | 基本一致 |
| - | homepage_photo_max | 新增字段 |
| - | ai_polish_prompt | 新增字段 |

### 4.2. 功能实现对比

#### 4.2.1. 已实现功能

1. **用户认证** - Payload内置认证系统
2. **权限控制** - 通过PermissionGroups实现（计划使用Payload内置权限）
3. **数据模型** - 核心模型已基本迁移
4. **富文本编辑** - 集成Lexical编辑器
5. **文件上传** - Score模型已实现PDF上传

#### 4.2.2. 待实现功能

1. **Article模型及文章管理功能**
2. **前端页面开发** (Next.js)
3. **AI文本润色功能**
4. **实时标题检查功能**
5. **动态加载(无限滚动)功能**
6. **即时编辑功能**
7. **图片/PDF预览功能**

### 4.3. 下一步迁移计划

#### 4.3.1. 第一阶段：完善数据模型 (1-2天)

1. 实现缺失的Article模型
   - 创建Articles集合
   - 添加相关字段（title, body, author等）

2. 完善现有模型的字段
   - 在Users模型中添加last_seen字段
   - 确保所有模型都有适当的索引和验证规则

#### 4.3.2. 第二阶段：后端功能开发 (3-5天)

1. 实现AI文本润色功能
   - 创建API端点
   - 集成阿里云DashScope服务
   - 实现文本润色逻辑

2. 实现实时标题检查功能
   - 创建API端点
   - 实现标题唯一性检查逻辑

3. 实现动态计算平均难度功能
   - 在TrackVersions模型中添加hook
   - 实现评分更新时自动计算平均难度

#### 4.3.3. 第三阶段：前端开发 (5-10天)

1. 搭建Next.js前端框架
   - 配置路由
   - 实现基础布局和UI组件

2. 实现核心页面
   - 首页（曲目列表）
   - 曲目详情页
   - 版本详情页
   - 用户个人页
   - 管理后台页

3. 实现交互功能
   - 无限滚动加载
   - 即时编辑
   - 图片/PDF预览
   - 评论功能

#### 4.3.4. 第四阶段：测试与优化 (2-3天)

1. 数据迁移测试
2. 功能完整性测试
3. 性能优化
4. 用户体验优化

### 4.4. 风险与注意事项

1. **数据迁移** - 需要谨慎处理从旧数据库到新数据库的数据迁移
2. **权限控制** - 确保新的权限系统与旧系统行为一致
3. **文件处理** - 确保上传的文件能够正确存储和访问
4. **兼容性** - 确保新系统与旧系统的API兼容性（如果有外部依赖）