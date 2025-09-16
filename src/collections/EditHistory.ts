import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

export const EditHistory: CollectionConfig = {
  slug: 'edit-history',
  labels: {
    singular: 'Edit History',
    plural: 'Edit History',
  },
  access: {
    create: authenticated,
    read: anyone,
    update: () => false, // 历史记录不允许修改
    delete: () => false, // 历史记录不允许删除
  },
  admin: {
    useAsTitle: 'summary',
    defaultColumns: ['summary', 'editor', 'target_type', 'target_id', 'action', 'createdAt'],
    description: '编辑历史记录，跟踪所有wiki式编辑的版本历史。',
  },
  fields: [
    {
      name: 'summary',
      type: 'text',
      required: true,
      label: 'Edit Summary',
      admin: {
        description: '编辑摘要，简要描述本次编辑的内容',
      },
    },
    {
      name: 'editor',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
      label: 'Editor',
      admin: {
        description: '执行此次编辑的用户',
      },
    },
    {
      name: 'target_type',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Track Description',
          value: 'track_description',
        },
        {
          label: 'Track Version Notes',
          value: 'track_version_notes',
        },
      ],
      label: 'Target Type',
      admin: {
        description: '编辑目标的类型',
      },
    },
    {
      name: 'target_id',
      type: 'number',
      required: true,
      index: true,
      label: 'Target ID',
      admin: {
        description: '编辑目标的ID（曲目ID或版本ID）',
      },
    },
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Create',
          value: 'create',
        },
        {
          label: 'Update',
          value: 'update',
        },
        {
          label: 'Revert',
          value: 'revert',
        },
      ],
      label: 'Action',
      admin: {
        description: '编辑操作类型',
      },
    },
    {
      name: 'content_before',
      type: 'json',
      label: 'Content Before',
      admin: {
        description: '编辑前的内容（JSON格式存储富文本）',
      },
    },
    {
      name: 'content_after',
      type: 'json',
      required: true,
      label: 'Content After',
      admin: {
        description: '编辑后的内容（JSON格式存储富文本）',
      },
    },
    {
      name: 'diff',
      type: 'textarea',
      label: 'Diff',
      admin: {
        description: '内容差异对比（可选，用于快速查看变更）',
      },
    },
    {
      name: 'ip_address',
      type: 'text',
      label: 'IP Address',
      admin: {
        description: '编辑者的IP地址',
      },
    },
    {
      name: 'user_agent',
      type: 'text',
      label: 'User Agent',
      admin: {
        description: '编辑者的浏览器信息',
      },
    },
    {
      name: 'rollback_to_version',
      type: 'text',
      label: 'Rollback to Version ID',
      admin: {
        description: 'If this is a rollback operation, the ID of the version being rolled back to',
        condition: (data) => data.operation_type === 'rollback',
      },
    },
    {
      name: 'is_approved',
      type: 'checkbox',
      defaultValue: false,
      label: 'Is Approved',
      admin: {
        description: '编辑是否已通过审核',
      },
    },
    {
      name: 'approved_by',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      label: 'Approved By',
      admin: {
        description: '审核通过此编辑的用户',
      },
    },
    {
      name: 'approved_at',
      type: 'date',
      label: 'Approved At',
      admin: {
        description: '审核通过的时间',
      },
    },
  ],
}