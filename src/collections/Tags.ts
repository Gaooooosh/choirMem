import type { CollectionConfig } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: {
    singular: 'Tag',
    plural: 'Tags',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'createdAt'],
    description: '标签，用于对版本进行分类。',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Tag Name',
      admin: {
        description: '标签的名称，如 "SATB"、"无伴奏"、"经典" 等',
      },
    },
  ],
}