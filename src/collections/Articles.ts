import type { CollectionConfig } from 'payload'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: {
    singular: 'Article',
    plural: 'Articles',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'publishedAt', 'createdAt'],
    description: '署名文章，由用户撰写的独立内容。',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      label: 'Title',
      admin: {
        description: '文章的标题',
      },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      label: 'Body',
      admin: {
        description: '文章的正文内容',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
      label: 'Author',
      admin: {
        description: '文章的作者',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Published At',
      admin: {
        position: 'sidebar',
        description: '文章发布日期',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      admin: {
        position: 'sidebar',
        description: '用于 URL 中的唯一标识符，如果留空将根据标题自动生成',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, _operation }) => {
        // Auto-generate slug from title if not provided
        if (data.title && !data.slug) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
            .replace(/^-+|-+$/g, '')
        }
      },
    ],
  },
}