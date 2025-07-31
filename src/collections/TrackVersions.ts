import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { Banner } from '../blocks/Banner/config'
import { Code } from '../blocks/Code/config'
import { MediaBlock } from '../blocks/MediaBlock/config'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'
import { increaseActivityScore } from '../hooks/increaseActivityScore'
import { updateRatings } from '../hooks/updateRatings'

export const TrackVersions: CollectionConfig = {
  slug: 'track-versions',
  labels: {
    singular: 'Track Version',
    plural: 'Track Versions',
  },
  access: {
    create: authenticated,
    read: anyone,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [increaseActivityScore, updateRatings],
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
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            HorizontalRuleFeature(),
          ]
        },
      }),
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
      name: 'ratings',
      type: 'array',
      label: 'Ratings',
      admin: {
        hidden: true,
        description: '用户对该版本的难度评分列表',
      },
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          hasMany: false,
          label: 'User',
        },
        {
          name: 'difficulty',
          type: 'number',
          min: 1,
          max: 5,
          required: true,
          label: 'Difficulty (1-5)',
        },
      ],
    },
  ],
}