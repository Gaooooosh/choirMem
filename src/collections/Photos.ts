import type { CollectionConfig } from 'payload'

export const Photos: CollectionConfig = {
  slug: 'photos',
  labels: {
    singular: 'Photo',
    plural: 'Photos',
  },
  upload: {
    staticDir: 'photos',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        crop: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        crop: 'centre',
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        crop: 'centre',
      },
    ],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['alt', 'track_version', 'uploader', 'createdAt'],
    description: '照片文件，用于记录演出或活动。',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text',
      admin: {
        description: '照片的替代文本描述，用于可访问性和 SEO',
      },
    },
    {
      name: 'caption',
      type: 'richText',
      label: 'Photo Caption',
      admin: {
        description: '照片的详细说明和描述',
      },
    },
    {
      name: 'track_version',
      type: 'relationship',
      relationTo: 'track-versions',
      hasMany: false,
      index: true,
      label: 'Related Track Version',
      admin: {
        description: '该照片相关的曲目版本（可选）',
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
        description: '上传该照片的用户',
      },
    },
  ],
}