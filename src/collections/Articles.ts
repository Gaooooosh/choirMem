import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { authenticatedOrPublished } from '../access/authenticatedOrPublished'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: {
    singular: 'Article',
    plural: 'Articles',
  },
  access: {
    create: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', 'status', 'createdAt'],
    description: '文章，用于发布合唱团新闻、活动报道和教学资料。',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      label: 'Title',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      label: 'Author',
    },
    {
      name: 'content_type',
      type: 'select',
      options: [
        {
          label: 'Rich Text',
          value: 'richtext',
        },
        {
          label: 'Markdown',
          value: 'markdown',
        },
      ],
      defaultValue: 'richtext',
      label: 'Content Type',
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      label: 'Content',
      admin: {
        condition: (data) => data.content_type === 'markdown',
      },
    },
    {
      name: 'rich_content',
      type: 'richText',
      required: false,
      label: 'Rich Content',
      admin: {
        condition: (data) => data.content_type === 'richtext',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Published',
          value: 'published',
        },
      ],
      defaultValue: 'draft',
      label: 'Status',
    },
    {
      name: 'cover_image',
      type: 'relationship',
      relationTo: 'media',
      hasMany: false,
      label: 'Cover Image',
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'Tags',
    },
  ],
  timestamps: true,
}