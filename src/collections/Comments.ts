import type { CollectionConfig } from 'payload'

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'body',
    defaultColumns: ['body', 'author', 'track', 'version', 'createdAt'],
  },
  fields: [
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
    },
    {
      name: 'track',
      type: 'relationship',
      relationTo: 'tracks',
      hasMany: false,
      index: true,
    },
    {
      name: 'version',
      type: 'relationship',
      relationTo: 'versions',
      hasMany: false,
      index: true,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Validate that either track or version is set, but not both
        const hasTrack = data.track
        const hasVersion = data.version

        if (!hasTrack && !hasVersion) {
          throw new Error('Comment must be associated with either a track or a version')
        }

        if (hasTrack && hasVersion) {
          throw new Error('Comment cannot be associated with both a track and a version')
        }
      },
    ],
  },
}