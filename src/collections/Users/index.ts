import type { CollectionConfig } from 'payload'
import crypto from 'crypto'
import { getServerSideURL } from '../../utilities/getURL'

import { authenticated } from '../../access/authenticated'
import { hasPermission } from '../../access/hasPermission'
import { canUpdateOwnProfile } from '../../access/canUpdateOwnProfile'

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
    update: canUpdateOwnProfile,
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
    {
      name: 'needs_password_reset',
      type: 'checkbox',
      label: 'Needs Password Reset',
      admin: {
        description: '标识用户是否需要重置密码（用于迁移用户）',
      },
      defaultValue: false,
    },
    {
      name: 'mfa_enabled',
      type: 'checkbox',
      label: 'MFA Enabled',
      defaultValue: false,
    },
    {
      name: 'mfa_secret',
      type: 'text',
      label: 'MFA Secret',
      admin: { readOnly: true },
    },
    {
      name: 'login_attempts',
      type: 'number',
      label: 'Login Attempts',
      defaultValue: 0,
    },
    {
      name: 'locked_until',
      type: 'date',
      label: 'Locked Until',
    },
    {
      name: 'lockUntil',
      type: 'date',
      label: 'Lock Until (alias)',
      admin: { description: '兼容旧字段名，未来清理' },
    },
    {
      name: 'email_verified',
      type: 'checkbox',
      label: 'Email Verified',
      defaultValue: false,
    },
    {
      name: 'email_verification_token',
      type: 'text',
      label: 'Email Verification Token',
      admin: { readOnly: true },
    },
    {
      name: 'email_verification_expiration',
      type: 'date',
      label: 'Email Verification Expiration',
      admin: { readOnly: true },
    },
    {
      name: 'pending_email',
      type: 'text',
      label: 'Pending Email',
      admin: { readOnly: true },
    },
    {
      name: 'pending_email_verification_token',
      type: 'text',
      label: 'Pending Email Verification Token',
      admin: { readOnly: true },
    },
    {
      name: 'pending_email_verification_expiration',
      type: 'date',
      label: 'Pending Email Verification Expiration',
      admin: { readOnly: true },
    },
    { name: 'email_verification_last_sent', type: 'date', label: 'Email Verification Last Sent' },
    { name: 'pending_email_verification_last_sent', type: 'date', label: 'Pending Email Verification Last Sent' },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation }) => {
        if (operation !== 'update') return
        const nextEmail = (data as any)?.email
        const prevEmail = (originalDoc as any)?.email
        if (nextEmail && prevEmail && nextEmail !== prevEmail) {
          const token = crypto.randomBytes(24).toString('hex')
          const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          ;(data as any).pending_email = nextEmail
          ;(data as any).pending_email_verification_token = token
          ;(data as any).pending_email_verification_expiration = exp
          ;(data as any).email = prevEmail
        }
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        if (operation === 'update') {
          const prevGroupId = typeof previousDoc?.group === 'object' ? previousDoc.group?.id : previousDoc?.group
          const currGroupId = typeof doc?.group === 'object' ? doc.group?.id : doc?.group
          if (prevGroupId !== currGroupId) {
            await req.payload.create({
              collection: 'permission-change-logs',
              data: {
                action: 'user_group_changed',
                user: doc.id,
                group: currGroupId || null,
                details: { from: prevGroupId || null, to: currGroupId || null },
                timestamp: new Date().toISOString(),
              },
            })
          }
          const changed = (doc as any)?.pending_email && (doc as any)?.pending_email_verification_token
          if (changed) {
            try {
              const urlBase = getServerSideURL()
              const link = `${urlBase}/email/confirm?t=${(doc as any).pending_email_verification_token}&uid=${doc.id}`
              await req.payload.sendEmail?.({
                to: String((doc as any).pending_email),
                subject: '验证你的新邮箱',
                html: `<p>请点击链接验证你的邮箱：</p><p><a href="${link}">${link}</a></p>`,
              })
              await req.payload.update({
                collection: 'users',
                id: (doc as any).id,
                data: { pending_email_verification_last_sent: new Date().toISOString() } as any,
              })
            } catch (e) {}
          }
        }
      },
    ],
  },
}
