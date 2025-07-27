import type { CollectionConfig } from 'payload'

export const Comments: CollectionConfig = {
  slug: 'comments',
  admin: {
    useAsTitle: 'body',
    defaultColumns: ['body', 'author', 'track', 'track_version', 'createdAt'],
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
      name: 'track_version',
      type: 'relationship',
      relationTo: 'track-versions',
      hasMany: false,
      index: true,
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Validate that either track or track_version is set, but not both
        const hasTrack = data.track
        const hasTrackVersion = data.track_version

        if (!hasTrack && !hasTrackVersion) {
          throw new Error('Comment must be associated with either a track or a track version')
        }

        if (hasTrack && hasTrackVersion) {
          throw new Error('Comment cannot be associated with both a track and a track version')
        }
      },
    ],
  },
}