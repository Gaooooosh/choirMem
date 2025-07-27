import type { CollectionConfig } from 'payload'

export const InvitationCodes: CollectionConfig = {
  slug: 'invitation-codes',
  labels: {
    singular: 'Invitation Code',
    plural: 'Invitation Codes',
  },
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'group', 'total_uses', 'uses_left', 'createdAt'],
    description: '注册邀请码，用于控制新用户注册及其初始权限组。',
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Invitation Code',
      admin: {
        description: '邀请码字符串，用户注册时需要输入',
      },
    },
    {
      name: 'group',
      type: 'relationship',
      relationTo: 'permission-groups',
      required: true,
      hasMany: false,
      label: 'Permission Group',
      admin: {
        description: '使用该邀请码注册的用户将被分配到该权限组',
      },
    },
    {
      name: 'total_uses',
      type: 'number',
      label: 'Total Uses',
      admin: {
        description: '该邀请码可使用的总次数（0 为无限制）',
      },
      defaultValue: 0,
    },
    {
      name: 'uses_left',
      type: 'number',
      label: 'Uses Left',
      admin: {
        description: '剩余使用次数（使用后自动递减）',
      },
      defaultValue: 0,
    },
  ],
}