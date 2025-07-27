import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'mediaType', 'track_version', 'uploader', 'createdAt'],
    description: '媒体文件，包括图像和视频，可选择关联到曲目版本。',
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if ((operation === 'create' || operation === 'update') && data.mimeType) {
          // Auto-detect media type based on MIME type
          if (data.mimeType.startsWith('image/')) {
            data.mediaType = 'image'
          } else if (data.mimeType.startsWith('video/')) {
            data.mediaType = 'video'
          }
        }
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text',
      admin: {
        description: '媒体文件的替代文本描述，用于可访问性和 SEO',
      },
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
      label: 'Caption',
      admin: {
        description: '媒体文件的详细说明和描述',
      },
    },
    {
      name: 'mediaType',
      type: 'select',
      options: [
        {
          label: 'Image',
          value: 'image',
        },
        {
          label: 'Video',
          value: 'video',
        },
      ],
      admin: {
        readOnly: true,
        description: '媒体类型，由系统根据文件类型自动检测',
      },
      index: true,
    },
    {
      name: 'track_version',
      type: 'relationship',
      relationTo: 'track-versions',
      hasMany: false,
      index: true,
      label: 'Related Track Version',
      admin: {
        description: '该媒体文件相关的曲目版本（可选）',
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
        description: '上传该媒体文件的用户',
      },
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    mimeTypes: [
      // Images
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      // Videos
      'video/mp4',
      'video/webm',
      'video/quicktime', // .mov
    ],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
      },
      {
        name: 'small',
        width: 600,
      },
      {
        name: 'medium',
        width: 900,
      },
      {
        name: 'large',
        width: 1400,
      },
      {
        name: 'xlarge',
        width: 1920,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
      },
    ],
  },
}
