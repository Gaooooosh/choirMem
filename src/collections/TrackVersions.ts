import type { CollectionConfig } from 'payload'

export const TrackVersions: CollectionConfig = {
  slug: 'track-versions',
  labels: {
    singular: 'Track Version',
    plural: 'Track Versions',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'track', 'creator', 'avg_difficulty', 'createdAt'],
    description: '版本，代表一个曲目的特定编排或演绎。',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Version Title',
      admin: {
        description: '该版本的标题或名称，如 "SATB 版本" 或 "无伴奏版"',
      },
    },
    {
      name: 'notes',
      type: 'richText',
      label: 'Version Notes',
      admin: {
        description: '关于该版本的详细说明和注意事项',
      },
    },
    {
      name: 'track',
      type: 'relationship',
      relationTo: 'tracks',
      required: true,
      hasMany: false,
      index: true,
      label: 'Track',
      admin: {
        description: '该版本所属的曲目',
      },
    },
    {
      name: 'creator',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
      label: 'Creator',
      admin: {
        description: '创建或上传该版本的用户',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'Tags',
      admin: {
        description: '用于分类和检索的标签',
      },
    },
    {
      name: 'likes',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      label: 'Likes',
      admin: {
        hidden: true,
        description: '点赞该版本的用户列表',
      },
    },
    {
      name: 'avg_difficulty',
      type: 'number',
      label: 'Average Difficulty',
      admin: {
        readOnly: true,
        description: '根据用户评分计算的平均难度等级（1-5分）',
      },
      min: 1,
      max: 5,
    },
  ],
}