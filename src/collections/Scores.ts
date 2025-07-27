import type { CollectionConfig } from 'payload'

export const Scores: CollectionConfig = {
  slug: 'scores',
  upload: {
    staticDir: 'scores',
    mimeTypes: ['application/pdf'],
  },
  admin: {
    useAsTitle: 'description',
    defaultColumns: ['description', 'track_version', 'uploader', 'createdAt'],
  },
  fields: [
    {
      name: 'description',
      type: 'text',
      required: true,
      label: 'Score Description',
    },
    {
      name: 'track_version',
      type: 'relationship',
      relationTo: 'track-versions',
      required: true,
      hasMany: false,
      index: true,
    },
    {
      name: 'uploader',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
    },
    {
      name: 'alt',
      type: 'text',
      label: 'Alternative text for accessibility',
    },
  ],
}