import type { CollectionConfig } from 'payload'

export const Versions: CollectionConfig = {
  slug: 'versions',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'track', 'creator', 'avg_difficulty', 'createdAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Version Title',
    },
    {
      name: 'notes',
      type: 'richText',
      label: 'Version Notes',
    },
    {
      name: 'track',
      type: 'relationship',
      relationTo: 'tracks',
      required: true,
      hasMany: false,
      index: true,
    },
    {
      name: 'creator',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
    },
    {
      name: 'likes',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'avg_difficulty',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Average difficulty rating calculated from user ratings',
      },
      min: 1,
      max: 5,
    },
  ],
}