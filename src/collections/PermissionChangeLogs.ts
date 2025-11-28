import type { CollectionConfig } from 'payload'

export const PermissionChangeLogs: CollectionConfig = {
  slug: 'permission-change-logs',
  labels: {
    singular: 'Permission Change Log',
    plural: 'Permission Change Logs',
  },
  access: {
    admin: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    read: ({ req }) => !!req.user?.is_admin,
    update: () => false,
    delete: ({ req }) => !!req.user?.is_admin,
  },
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['action', 'user', 'group', 'timestamp'],
  },
  fields: [
    { name: 'action', type: 'text', required: true },
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'group', type: 'relationship', relationTo: 'permission-groups' },
    { name: 'details', type: 'json' },
    { name: 'timestamp', type: 'date', required: true },
  ],
}

