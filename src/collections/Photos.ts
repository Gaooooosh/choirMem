import type { CollectionConfig } from 'payload'

export const Photos: CollectionConfig = {
  slug: 'photos',
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
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alternative text for accessibility',
    },
    {
      name: 'caption',
      type: 'richText',
      label: 'Photo Caption',
    },
    {
      name: 'track_version',
      type: 'relationship',
      relationTo: 'track-versions',
      hasMany: false,
      index: true,
      label: 'Related Track Version',
    },
    {
      name: 'uploader',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
    },
  ],
}