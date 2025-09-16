import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { hasPermission } from '../access/hasPermission'

export const PendingEdits: CollectionConfig = {
  slug: 'pending-edits',
  labels: {
    singular: 'Pending Edit',
    plural: 'Pending Edits',
  },
  admin: {
    useAsTitle: 'summary',
    defaultColumns: ['summary', 'target_type', 'target_id', 'editor', 'status', 'created_at'],
    group: 'Wiki Management',
  },
  access: {
    create: authenticated, // 认证用户可以创建待审核编辑
    read: hasPermission('can_moderate_edits'), // 只有审核员可以查看
    update: hasPermission('can_moderate_edits'), // 只有审核员可以审核
    delete: hasPermission('can_moderate_edits'), // 只有审核员可以删除
  },
  fields: [
    {
      name: 'summary',
      type: 'text',
      required: true,
      label: 'Edit Summary',
      admin: {
        description: '编辑摘要，简要描述此次编辑的内容',
      },
    },
    {
      name: 'editor',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      label: 'Editor',
      admin: {
        description: '提交此编辑的用户',
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
      type: 'text',
      required: true,
      label: 'Target ID',
      admin: {
        description: '编辑目标的ID（曲目ID或版本ID）',
      },
    },
    {
      name: 'field_name',
      type: 'text',
      required: true,
      label: 'Field Name',
      admin: {
        description: '被编辑的字段名称（如description或notes）',
      },
    },
    {
      name: 'original_content',
      type: 'richText',
      label: 'Original Content',
      admin: {
        description: '编辑前的原始内容',
      },
    },
    {
      name: 'new_content',
      type: 'richText',
      required: true,
      label: 'New Content',
      admin: {
        description: '编辑后的新内容',
      },
    },
    {
      name: 'diff',
      type: 'textarea',
      label: 'Content Diff',
      admin: {
        description: '内容差异（自动生成）',
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        {
          label: 'Pending Review',
          value: 'pending',
        },
        {
          label: 'Approved',
          value: 'approved',
        },
        {
          label: 'Rejected',
          value: 'rejected',
        },
        {
          label: 'Auto-Approved',
          value: 'auto_approved',
        },
      ],
      label: 'Status',
      admin: {
        description: '审核状态',
      },
    },
    {
      name: 'reviewer',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      label: 'Reviewer',
      admin: {
        description: '审核此编辑的用户',
      },
    },
    {
      name: 'review_comment',
      type: 'textarea',
      label: 'Review Comment',
      admin: {
        description: '审核意见或拒绝原因',
      },
    },
    {
      name: 'reviewed_at',
      type: 'date',
      label: 'Reviewed At',
      admin: {
        description: '审核时间',
        readOnly: true,
      },
    },
    {
      name: 'ip_address',
      type: 'text',
      label: 'IP Address',
      admin: {
        description: '编辑者的IP地址',
        readOnly: true,
      },
    },
    {
      name: 'user_agent',
      type: 'text',
      label: 'User Agent',
      admin: {
        description: '编辑者的浏览器信息',
        readOnly: true,
      },
    },
    {
      name: 'auto_approved_reason',
      type: 'text',
      label: 'Auto-Approved Reason',
      admin: {
        description: '自动批准的原因（如信任用户、小幅修改等）',
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }: { data: any; operation: string }) => {
        // 设置审核时间
        if (operation === 'update' && data.status !== 'pending' && !data.reviewed_at) {
          data.reviewed_at = new Date().toISOString()
        }
        return data
      },
    ],
  },
  timestamps: true,
}