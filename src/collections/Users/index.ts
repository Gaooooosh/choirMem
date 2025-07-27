import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email', 'username', 'group', 'activity_score'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'username',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'group',
      type: 'relationship',
      relationTo: 'permission-groups',
      hasMany: false,
    },
    {
      name: 'avatar',
      type: 'relationship',
      relationTo: 'photos',
      hasMany: false,
    },
    {
      name: 'bio',
      type: 'richText',
    },
    {
      name: 'activity_score',
      type: 'number',
      admin: {
        readOnly: true,
        description: 'Activity score calculated from user contributions',
      },
      defaultValue: 0,
    },
  ],
  timestamps: true,
}
