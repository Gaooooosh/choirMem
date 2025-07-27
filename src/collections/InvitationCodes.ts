import type { CollectionConfig } from 'payload'

export const InvitationCodes: CollectionConfig = {
  slug: 'invitation-codes',
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'group', 'total_uses', 'uses_left', 'createdAt'],
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'group',
      type: 'relationship',
      relationTo: 'permission-groups',
      required: true,
      hasMany: false,
    },
    {
      name: 'total_uses',
      type: 'number',
      admin: {
        description: 'Total number of times this invitation code can be used (0 for unlimited)',
      },
      defaultValue: 0,
    },
    {
      name: 'uses_left',
      type: 'number',
      admin: {
        description: 'Number of uses remaining (automatically decremented)',
      },
      defaultValue: 0,
    },
  ],
}