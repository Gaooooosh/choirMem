import type { CollectionConfig } from 'payload'

export const UserCollections: CollectionConfig = {
  slug: 'user-collections',
  labels: {
    singular: 'User Collection',
    plural: 'User Collections',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'creator', 'track_versions', 'createdAt'],
    description: '乐集，用户创建的版本集合。',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
      label: 'Collection Name',
      admin: {
        description: '乐集的名称',
      },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      admin: {
        description: '乐集的描述和说明',
      },
    },
    {
      name: 'creator',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      index: true,
      label: 'Creator',
      admin: {
        description: '创建该乐集的用户',
      },
    },
    {
      name: 'track_versions',
      type: 'relationship',
      relationTo: 'track-versions',
      hasMany: true,
      label: 'Track Versions',
      admin: {
        description: '乐集中包含的曲目版本列表',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Slug',
      admin: {
        position: 'sidebar',
        description: '用于 URL 中的唯一标识符，如果留空将根据名称自动生成',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, _operation }) => {
        // Auto-generate slug from name if not provided
        if (data.name && !data.slug) {
          data.slug = data.name
            .toLowerCase()
            .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
            .replace(/^-+|-+$/g, '')
        }
      },
    ],
  },
}