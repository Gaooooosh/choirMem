# 迁移计划：从 Flask 到 Next.js & Payload CMS

本文档概述了将基于 Flask 的合唱团曲库项目（位于 `../choirMem` ）迁移到使用 Next.js (前端) 和 Payload (无头 CMS 后端) 的现代技术栈（本项目）所需的详细步骤。该计划分为几个不同阶段，从数据建模开始，到前端实现和数据迁移结束。

## 第一阶段：后端 - 在 Payload 中复制数据结构

第一步也是最关键的一步，是将您的 SQLAlchemy 模型转换为 Payload 的集合（Collections）和全局变量（Globals）。这将构成新的数据基础。所有的集合配置文件都将在 `src/collections/` 目录下创建。

### 1.1. 核心内容集合

这些集合直接对应于您 Flask 应用中的主要实体。

1. 曲目 (Tracks) (src/collections/Tracks.ts)

这将是音乐作品的顶层实体。

- **字段:**
  - `title` (`text`, 必需)
  - `description` (`richText`)
  - `title_sort` (`text`, 隐藏, 索引): 将使用钩子（hook）自动填充，存储标题的拼音版本以便正确排序。
- 版本 (Versions) (src/collections/Versions.ts)

此集合将与 Tracks 建立关联。

- **字段:**
  - `title` (`text`, 必需): 例如，“SATB 无伴奏合唱版”。
  - `notes` (`richText`): 用于记录版本特定的细节。
  - `track` (`relationship`, 必需, to: 'tracks'): 所属的父级曲目。
  - `creator` (`relationship`, 必需, to: 'users'): 创建此版本的用户。
  - `tags` (`relationship`, hasMany, to: 'tags')
  - `likes` (`relationship`, hasMany, to: 'users'): 用于存储用户的“喜欢”。我们将从管理界面隐藏此字段，并通过钩子或端点进行管理。
  - `avg_difficulty` (`number`, admin.readOnly): 将通过钩子计算得出。
- 乐谱 (Scores) (src/collections/Scores.ts)

这将是一个用于上传 PDF 文件的 upload 集合。

- **字段:**
  - `description` (`text`, 必需): 例如，“总谱”、“女高音声部谱”。
  - `version` (`relationship`, 必需, to: 'versions'): 此乐谱所属的版本。
  - `uploader` (`relationship`, 必需, to: 'users')。
- **上传配置:** 启用 `staticDir` 来存储文件，并配置为只接受 PDF 文件。
- 照片 (Photos) (src/collections/Photos.ts)

这将是另一个 upload 集合，用以替代模板中的 Media 集合。

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

## 第二阶段：实现访问控制

Payload 的访问控制功能是您 Flask 装饰器的直接替代品。您将主要在 `src/access/` 目录中定义它们。

1. 创建一个集中的权限检查器：

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

Payload 钩子用于在数据库操作之前或之后添加自定义逻辑，就像您在 Flask 路由中所做的那样。

1. 拼音排序标题 (src/collections/Tracks.ts)

使用 beforeChange 钩子自动生成 title_sort 字段。

- **钩子:** `beforeChange`
- **逻辑:** 如果 `title` 字段发生变化，使用 `pinyin` 等库生成排序键并将其保存到 `title_sort` 字段。
- 使用邀请码注册用户 (src/collections/Users/index.ts)

在 Users 集合上使用 afterCreate 钩子。

- **钩子:** `afterCreate`
- **逻辑:** 找到用于注册的 `InvitationCode`，将其 `uses_left` 计数减一，并保存。
- 活动分数计算 (多个集合)

在 Comments、Scores 和 Photos 集合上使用 afterChange 和 afterDelete 钩子。

- **钩子:** `afterChange`, `afterDelete`
- **逻辑:** 当文档被创建或删除时，获取相关用户，并根据其贡献（评论、乐谱、照片）的数量重新计算 `activity_score`。这可以通过自定义端点或工具函数来完成。
- 平均难度计算 (src/collections/Ratings.ts)

在 Ratings 集合上使用 afterChange 钩子。

- **钩子:** `afterChange`
- **逻辑:** 在添加或更改评分后，获取相关的 `Version`，查询其所有评分，计算新的平均值，并更新该 `Version` 文档的 `avg_difficulty` 字段。

## 第四阶段：使用 Next.js 和 React 进行前端开发

此阶段涉及将您的 Jinja2 模板转换为 React 组件，并在 Next.js App Router (`src/app/(frontend)/`) 中创建页面路由。

### 4.1. 页面结构 (动态路由)

创建以下目录结构以匹配您的旧路由：

- `src/app/(frontend)/tracks/[slug]/page.tsx`: 替代 `track_detail.html`。
- `src/app/(frontend)/versions/[id]/page.tsx`: 替代 `version_detail.html`。
- `src/app/(frontend)/profile/[username]/page.tsx`: 替代 `user_profile.html`。
- `src/app/(frontend)/articles/page.tsx`: 替代 `articles.html`。
- `src/app/(frontend)/articles/[slug]/page.tsx`: 替代 `article_detail.html`。
- ... 以此类推，用于其他页面。

### 4.2. 在服务器组件中获取数据

在每个 `page.tsx` 内部，使用 Payload 的 Local API 在服务器端获取数据。

**`src/app/(frontend)/tracks/[slug]/page.tsx` 示例:**

```
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { notFound } from 'next/navigation';

export default async function TrackPage({ params: { slug } }) {
  const payload = await getPayload({ config: configPromise });
  const result = await payload.find({
    collection: 'tracks',
    where: { slug: { equals: slug } },
    depth: 2, // 增加 depth 以填充版本、创建者等信息
  });

  const track = result.docs[0];

  if (!track) {
    return notFound();
  }

  return (
    <div>
      <h1>{track.title}</h1>
      {/* 在此处渲染曲目详情和版本列表组件 */}
    </div>
  );
}
```

### 4.3. 基于组件的 UI

将您的 UI 分解为可重用的 React 组件，并存放在 `src/components/` 目录中。

- **`TrackCard.tsx`**: 用于显示单个曲目的组件，类似于 `_item_cards.html`。
- **`UserCard.tsx`**: 用于成员页面，替代 `_user_cards.html`。
- **`CommentSection.tsx`**: 用于显示和提交评论的客户端组件。
- **`LikeButton.tsx`**, **`RatingComponent.tsx`**: 用于处理用户交互的客户端组件。

### 4.4. 使用服务器操作实现交互性

对于“喜欢”、评分或评论等操作，请使用 Next.js 服务器操作 (Server Actions)。这允许客户端组件安全地调用服务器端逻辑，而无需创建单独的 API 端点。

**`LikeButton.tsx` 示例:**

```
'use client';
import { likeVersionAction } from './_actions'; // 服务器操作文件

export function LikeButton({ versionId, initialLikes, isLiked }) {
  // ... 使用 useOptimistic 实现即时 UI 更新
  
  return (
    <form action={likeVersionAction}>
      <input type="hidden" name="versionId" value={versionId} />
      <button type="submit">
        {isLiked ? '取消喜欢' : '喜欢'} ({initialLikes})
      </button>
    </form>
  );
}
```

## 第五阶段：管理面板定制

Payload 提供了一个功能丰富的开箱即用的管理界面。您的主要任务是配置列表视图和字段显示，以获得更好的管理体验。

- **列表视图:** 在每个集合配置中，使用 `admin.defaultColumns` 来指定要在列表视图中显示的字段。
- **标题字段:** 使用 `admin.useAsTitle: 'title'` (或 `name`) 使列表视图中的链接更具可读性。
- **系统设置:** 您创建的“系统设置”全局变量将自动出现在管理侧边栏中，无需为这些设置创建自定义的管理页面。
- **AI 润色:** `SystemSettings` 全局变量中的 `ai_polish_prompt` 字段允许管理员直接从 CMS 更新提示词。

## 第六阶段：数据迁移

一旦新架构最终确定，您需要从旧的 SQLite 数据库迁移数据。

1. **导出数据:** 编写一个简单的 Python 脚本，将旧 SQLite 数据库中每个表的数据导出为 JSON 文件。
2. **创建填充脚本:** 在您的 Payload 项目中创建一个新的端点或独立的 Node.js 脚本。
3. **映射和导入:** 在此脚本中，读取 JSON 文件。对于每条记录，将旧字段名映射到新的 Payload 字段名，并使用 Payload Local API (`payload.create`) 插入数据。
   - **顺序至关重要:** 首先导入用户和权限组，然后是曲目，接着是版本，最后是相关的项目，如乐谱和评论，确保使用上一步导入的 ID 正确地将它们关联起来。
4. **迁移文件:** 将旧 `uploads` 目录中的所有文件复制到 `Media` 和 `Scores` 集合的 `staticDir` 中指定的新目录。如有必要，编写一个脚本来更新 `Scores` 和 `Photos` 集合中的 `filename` 字段，以匹配新的文件位置。

这种结构化的方法将确保从您的 Flask 应用到新的 Next.js 和 Payload 技术栈的平稳、完整迁移。