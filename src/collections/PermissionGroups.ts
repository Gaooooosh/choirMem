import type { CollectionConfig } from 'payload'

export const PermissionGroups: CollectionConfig = {
  slug: 'permission-groups',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'can_view_scores', 'can_upload_scores', 'can_create_tracks'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'can_view_scores',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'can_upload_scores',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'can_upload_photos',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'can_post_comments',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'can_create_tracks',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}