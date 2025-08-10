import type { CollectionConfig } from 'payload'

import { hasPermission } from '../access/hasPermission'
import { authenticated } from '../access/authenticated'
import { increaseActivityScore } from '../hooks/increaseActivityScore'

export const Scores: CollectionConfig = {
  slug: 'scores',
  labels: {
    singular: 'Score',
    plural: 'Scores',
  },
  upload: {
    staticDir: 'scores',
    mimeTypes: ['application/pdf'],
  },
  access: {
    create: hasPermission('can_upload_scores'),
    read: hasPermission('can_view_scores'),
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [increaseActivityScore],
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'track_version', 'uploader', 'createdAt'],
    description: '乐谱文件，通常是 PDF 格式。',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Score Title',
      admin: {
        description: '乐谱文件的标题，如 "第一章"、"完整版" 等',
      },
    },
    {
      name: 'description',
      type: 'text',
      required: false,
      label: 'Score Description',
      admin: {
        description: '乐谱文件的详细描述（可选）',
      },
    },
    {
      name: 'track_version',
      type: 'relationship',
      relationTo: 'track-versions',
      required: true,
      hasMany: false,
      index: true,
      label: 'Track Version',
      admin: {
        description: '该乐谱所属的曲目版本',
      },
    },
    {
      name: 'uploader',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
      label: 'Uploader',
      admin: {
        description: '上传该乐谱文件的用户',
      },
    },
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text',
      admin: {
        description: '用于可访问性的替代文本描述',
      },
    },
  ],
}