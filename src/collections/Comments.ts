import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { anyone } from '../access/anyone'
import { increaseActivityScore } from '../hooks/increaseActivityScore'

export const Comments: CollectionConfig = {
  slug: 'comments',
  labels: {
    singular: 'Comment',
    plural: 'Comments',
  },
  access: {
    create: authenticated,
    read: anyone,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'body',
    defaultColumns: ['body', 'author', 'track', 'track_version', 'createdAt'],
    description: '评论，可以附加到曲目或版本上。',
  },
  fields: [
    {
      name: 'body',
      type: 'textarea',
      required: true,
      label: 'Comment Body',
      admin: {
        description: '评论的内容文本',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
      label: 'Author',
      admin: {
        description: '发表评论的用户',
      },
    },
    {
      name: 'track',
      type: 'relationship',
      relationTo: 'tracks',
      hasMany: false,
      index: true,
      label: 'Track',
      admin: {
        description: '评论所属的曲目（与版本二选一）',
      },
    },
    {
      name: 'track_version',
      type: 'relationship',
      relationTo: 'track-versions',
      hasMany: false,
      index: true,
      label: 'Track Version',
      admin: {
        description: '评论所属的版本（与曲目二选一）',
      },
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
    afterChange: [increaseActivityScore],
  },
}