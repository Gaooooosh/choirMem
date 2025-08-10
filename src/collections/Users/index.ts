import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { hasPermission } from '../../access/hasPermission'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'User',
    plural: 'Users',
  },
  access: {
    admin: authenticated,
    create: hasPermission('can_manage_users'),
    delete: hasPermission('can_manage_users'),
    read: authenticated,
    update: hasPermission('can_manage_users'),
  },
  admin: {
    defaultColumns: ['name', 'email', 'username', 'group', 'activity_score'],
    useAsTitle: 'name',
    description: '用户模型，支持认证、权限和个人信息管理。',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
    },
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Username',
      admin: {
        description: '用于登录的唯一用户名',
      },
    },
    {
      name: 'group',
      type: 'relationship',
      relationTo: 'permission-groups',
      hasMany: false,
      label: 'Permission Group',
      admin: {
        description: '用户所属的权限组，决定其在系统中的操作权限',
      },
    },
    {
      name: 'avatar',
      type: 'relationship',
      relationTo: 'media',
      hasMany: false,
      label: 'Avatar',
      admin: {
        description: '用户头像图片',
      },
    },
    {
      name: 'default_avatar',
      type: 'select',
      label: 'Default Avatar',
      options: [
        { label: '音符', value: 'music-note' },
        { label: '麦克风', value: 'microphone' },
        { label: '钢琴', value: 'piano' },
        { label: '小提琴', value: 'violin' },
        { label: '吉他', value: 'guitar' },
        { label: '鼓', value: 'drums' },
        { label: '萨克斯', value: 'saxophone' },
        { label: '小号', value: 'trumpet' },
        { label: '长笛', value: 'flute' },
        { label: '大提琴', value: 'cello' },
      ],
      admin: {
        description: '当没有上传自定义头像时使用的默认头像',
      },
    },
    {
      name: 'bio',
      type: 'richText',
      label: 'Bio',
      admin: {
        description: '用户的个人简介和自我介绍',
      },
    },
    {
      name: 'activity_score',
      type: 'number',
      label: 'Activity Score',
      admin: {
        readOnly: true,
        description: '根据用户贡献（上传乐谱、发表评论等）自动计算的活动分数',
      },
      defaultValue: 0,
    },
    {
      name: 'is_admin',
      type: 'checkbox',
      label: 'Is Admin',
      admin: {
        description: '标识用户是否为系统管理员',
      },
      defaultValue: false,
    },
  ],
  timestamps: true,
}
