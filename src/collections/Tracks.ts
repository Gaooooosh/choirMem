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

import { hasPermission } from '../access/hasPermission'
import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'

export const Tracks: CollectionConfig = {
  slug: 'tracks',
  labels: {
    singular: 'Track',
    plural: 'Tracks',
  },
  access: {
    create: hasPermission('can_create_tracks'),
    read: anyone,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'createdAt', 'updatedAt'],
    description: '曲目，是音乐作品的最高层级实体。',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      index: true,
      label: 'Title',
      admin: {
        description: '曲目的名称或标题',
      },
    },
    {
      name: 'description',
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
      label: 'Description',
      admin: {
        description: '曲目的详细描述和介绍',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      admin: {
        position: 'sidebar',
        description: '用于 URL 中的唯一标识符，如果留空将根据标题自动生成',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Auto-generate slug from title if not provided
        if (data.title && !data.slug) {
          data.slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9一-鿿]+/g, '-')
            .replace(/^-+|-+$/g, '')
        }
      },
    ],
  },
}