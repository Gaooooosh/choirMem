import type { CollectionConfig } from 'payload'
import { hasPermission } from '../access/hasPermission'

export const EditLocks: CollectionConfig = {
  slug: 'edit-locks',
  labels: {
    singular: '编辑锁定',
    plural: '编辑锁定'
  },
  access: {
    create: hasPermission('can_edit_wiki'),
    read: hasPermission('can_edit_wiki'),
    update: hasPermission('can_edit_wiki'),
    delete: hasPermission('can_edit_wiki')
  },
  admin: {
    useAsTitle: 'collection',
    defaultColumns: ['collection', 'document_id', 'user', 'expires_at'],
    group: 'Wiki'
  },
  fields: [
    {
      name: 'collection',
      type: 'text',
      label: '集合名称',
      required: true,
      admin: {
        description: '被锁定文档所属的集合'
      }
    },
    {
      name: 'document_id',
      type: 'text',
      label: '文档ID',
      required: true,
      admin: {
        description: '被锁定文档的ID'
      }
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      label: '锁定用户',
      required: true,
      admin: {
        description: '锁定此文档的用户'
      }
    },
    {
      name: 'expires_at',
      type: 'date',
      label: '过期时间',
      required: true,
      admin: {
        description: '锁定过期的时间',
        date: {
          pickerAppearance: 'dayAndTime'
        }
      }
    },
    {
      name: 'created_at',
      type: 'date',
      label: '创建时间',
      admin: {
        readOnly: true,
        position: 'sidebar'
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            if (!siblingData.created_at) {
              siblingData.created_at = new Date()
            }
            return siblingData.created_at
          }
        ]
      }
    }
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // 自动清理过期的锁定
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          throw new Error('Cannot create expired lock')
        }
      }
    ]
  },
  timestamps: true
}