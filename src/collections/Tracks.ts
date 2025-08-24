import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import {
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  LinkFeature,
  ParagraphFeature,
} from '@payloadcms/richtext-lexical'

import {
  BgColorFeature,
  HighlightColorFeature,
  TextColorFeature,
  YoutubeFeature,
  VimeoFeature,
} from 'payloadcms-lexical-ext'

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
            ParagraphFeature(),
            BoldFeature(),
            ItalicFeature(),
            UnderlineFeature(),
            LinkFeature({
              enabledCollections: ['pages', 'posts', 'tracks'],
            }),
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
            HorizontalRuleFeature(),
            TextColorFeature({
              colors: [
                { type: 'button', label: '红色', color: '#ef4444' },
                { type: 'button', label: '蓝色', color: '#3b82f6' },
                { type: 'button', label: '绿色', color: '#22c55e' },
                { type: 'button', label: '黄色', color: '#eab308' },
                { type: 'button', label: '紫色', color: '#a855f7' },
                { type: 'button', label: '橙色', color: '#f97316' },
                { type: 'button', label: '粉色', color: '#ec4899' },
                { type: 'button', label: '灰色', color: '#6b7280' },
              ]
            }),
            HighlightColorFeature({
              colors: [
                { type: 'button', label: '黄色高亮', color: '#fef08a' },
                { type: 'button', label: '绿色高亮', color: '#bbf7d0' },
                { type: 'button', label: '蓝色高亮', color: '#bfdbfe' },
                { type: 'button', label: '粉色高亮', color: '#f9a8d4' },
                { type: 'button', label: '紫色高亮', color: '#ddd6fe' },
              ]
            }),
            BgColorFeature({
              colors: [
                { type: 'button', label: '浅灰背景', color: '#f3f4f6' },
                { type: 'button', label: '浅蓝背景', color: '#eff6ff' },
                { type: 'button', label: '浅绿背景', color: '#f0fdf4' },
                { type: 'button', label: '浅黄背景', color: '#fefce8' },
                { type: 'button', label: '浅红背景', color: '#fef2f2' },
              ]
            }),
            YoutubeFeature(),
            VimeoFeature(),
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