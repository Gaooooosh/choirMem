import { CollectionConfig } from 'payload'

export const EditNotifications: CollectionConfig = {
  slug: 'edit-notifications',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'recipient', 'type', 'read', 'createdAt'],
    group: 'Wiki系统',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      
      // 用户只能查看发给自己的通知
      return {
        recipient: {
          equals: user.id,
        },
      }
    },
    create: ({ req: { user } }) => {
      // 只有管理员可以创建通知
      return !!(user as any)?.is_admin
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      
      // 用户只能更新自己的通知（标记为已读）
      return {
        recipient: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      // 只有管理员可以删除通知
      return !!(user as any)?.is_admin
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: '通知标题',
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      label: '通知内容',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      label: '通知类型',
      options: [
        {
          label: '编辑提交',
          value: 'edit_submitted',
        },
        {
          label: '编辑审核通过',
          value: 'edit_approved',
        },
        {
          label: '编辑审核拒绝',
          value: 'edit_rejected',
        },
        {
          label: '内容回滚',
          value: 'content_rollback',
        },
        {
          label: '编辑冲突',
          value: 'edit_conflict',
        },
        {
          label: '系统通知',
          value: 'system',
        },
      ],
    },
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: '接收者',
    },
    {
      name: 'sender',
      type: 'relationship',
      relationTo: 'users',
      label: '发送者',
    },
    {
      name: 'related_collection',
      type: 'select',
      label: '相关集合',
      options: [
        {
          label: '曲目',
          value: 'tracks',
        },
        {
          label: '曲目版本',
          value: 'track-versions',
        },
      ],
    },
    {
      name: 'related_document_id',
      type: 'text',
      label: '相关文档ID',
    },
    {
      name: 'related_field',
      type: 'text',
      label: '相关字段',
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      label: '已读',
    },
    {
      name: 'read_at',
      type: 'date',
      label: '阅读时间',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'action_url',
      type: 'text',
      label: '操作链接',
      admin: {
        description: '点击通知后跳转的URL',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      label: '元数据',
      admin: {
        description: '存储额外的通知相关数据',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // 标记为已读时设置阅读时间
        if (operation === 'update' && data.read && !data.read_at) {
          data.read_at = new Date().toISOString()
        }
        return data
      },
    ],
  },
  timestamps: true,
}