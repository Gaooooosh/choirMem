import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'
import { hasPermission } from '../access/hasPermission'

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  labels: {
    singular: 'Announcement',
    plural: 'Announcements',
  },
  access: {
    create: hasPermission('can_manage_users'), // 只有管理员可以创建公告
    read: anyone, // 所有人都可以查看公告
    update: hasPermission('can_manage_users'), // 只有管理员可以更新公告
    delete: hasPermission('can_manage_users'), // 只有管理员可以删除公告
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'priority', 'createdAt', 'expiresAt'],
    description: '公告管理，管理员可以发布重要通知和消息。',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      label: '公告标题',
      admin: {
        description: '公告的标题，将显示在首页',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: '公告内容',
      admin: {
        description: '公告的详细内容',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: '草稿',
          value: 'draft',
        },
        {
          label: '已发布',
          value: 'published',
        },
        {
          label: '已过期',
          value: 'expired',
        },
      ],
      defaultValue: 'draft',
      required: true,
      label: '状态',
      admin: {
        description: '公告的发布状态',
      },
    },
    {
      name: 'priority',
      type: 'select',
      options: [
        {
          label: '普通',
          value: 'normal',
        },
        {
          label: '重要',
          value: 'important',
        },
        {
          label: '紧急',
          value: 'urgent',
        },
      ],
      defaultValue: 'normal',
      required: true,
      label: '优先级',
      admin: {
        description: '公告的重要程度，影响显示样式',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      label: '发布者',
      admin: {
        description: '发布该公告的管理员',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: '过期时间',
      admin: {
        description: '公告的过期时间，过期后将自动隐藏（可选）',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'showOnHomepage',
      type: 'checkbox',
      defaultValue: true,
      label: '在首页显示',
      admin: {
        description: '是否在首页显示此公告',
      },
    },
  ],
  timestamps: true,
}
