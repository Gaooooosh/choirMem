import type { CollectionConfig } from 'payload'

export const TrackVersionRatings: CollectionConfig = {
  slug: 'track-version-ratings',
  admin: {
    defaultColumns: ['user', 'track_version', 'difficulty', 'createdAt'],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
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
      name: 'difficulty',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      admin: {
        step: 1,
      },
    },
  ],
  // Note: Unique constraint will be handled in database migration
  // For now, we'll ensure uniqueness through application logic
}