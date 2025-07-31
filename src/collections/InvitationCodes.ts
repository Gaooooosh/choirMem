import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { hasPermission } from '../access/hasPermission'

export const InvitationCodes: CollectionConfig = {
  slug: 'invitation-codes',
  labels: {
    singular: 'Invitation Code',
    plural: 'Invitation Codes',
  },
  access: {
    create: hasPermission('can_manage_invitation_codes'),
    read: authenticated,
    update: hasPermission('can_manage_invitation_codes'),
    delete: hasPermission('can_manage_invitation_codes'),
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
      hooks: {
        beforeChange: [
          ({ value, originalDoc }) => {
            // 如果设置为无限制（0），则 uses_left 也应为 0
            // 在创建时设置 uses_left 等于 total_uses（除非是无限制）
            return value;
          },
        ],
      },
    },
    {
      name: 'uses_left',
      type: 'number',
      label: 'Uses Left',
      admin: {
        description: '剩余使用次数（使用后自动递减）',
      },
      defaultValue: 0,
      index: true,
      hooks: {
        beforeChange: [
          ({ value, originalDoc, data }) => {
            // 在创建时，如果 total_uses > 0，则 uses_left 应该等于 total_uses
            // 如果 total_uses = 0，则为无限制邀请码
            if (!originalDoc && data.total_uses > 0) {
              return data.total_uses;
            }
            return value;
          },
        ],
      },
    }
  ],
}