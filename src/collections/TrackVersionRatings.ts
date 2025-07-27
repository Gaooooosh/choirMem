import type { CollectionConfig } from 'payload'

export const TrackVersionRatings: CollectionConfig = {
  slug: 'track-version-ratings',
  labels: {
    singular: 'Track Version Rating',
    plural: 'Track Version Ratings',
  },
  admin: {
    defaultColumns: ['user', 'track_version', 'difficulty', 'createdAt'],
    description: '评分，用户对版本的难度评分。',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
      label: 'User',
      admin: {
        description: '进行评分的用户',
      },
    },
    {
      name: 'track_version',
      type: 'relationship',
      relationTo: 'track-versions',
      required: true,
      hasMany: false,
      index: true,
      label: 'Track Version',
      admin: {
        description: '被评分的曲目版本',
      },
    },
    {
      name: 'difficulty',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      label: 'Difficulty Rating',
      admin: {
        step: 1,
        description: '难度评分（1-5 分，1 为最简单，5 为最难）',
      },
    },
  ],
  // Note: Unique constraint will be handled in database migration
  // For now, we'll ensure uniqueness through application logic
}