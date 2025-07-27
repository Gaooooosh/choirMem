import type { CollectionConfig } from 'payload'

export const PermissionGroups: CollectionConfig = {
  slug: 'permission-groups',
  labels: {
    singular: 'Permission Group',
    plural: 'Permission Groups',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'can_view_scores', 'can_upload_scores', 'can_create_tracks'],
    description: '权限组，定义了不同用户组的操作权限。',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Group Name',
      admin: {
        description: '权限组的名称，如 "管理员"、"用户"、"客人" 等',
      },
    },
    {
      name: 'can_view_scores',
      type: 'checkbox',
      defaultValue: false,
      label: 'Can View Scores',
      admin: {
        description: '允许查看和下载乐谱 PDF 文件',
      },
    },
    {
      name: 'can_upload_scores',
      type: 'checkbox',
      defaultValue: false,
      label: 'Can Upload Scores',
      admin: {
        description: '允许上传新的乐谱 PDF 文件',
      },
    },
    {
      name: 'can_upload_photos',
      type: 'checkbox',
      defaultValue: false,
      label: 'Can Upload Photos',
      admin: {
        description: '允许上传演出或活动相关照片',
      },
    },
    {
      name: 'can_post_comments',
      type: 'checkbox',
      defaultValue: false,
      label: 'Can Post Comments',
      admin: {
        description: '允许在曲目和版本下发表评论',
      },
    },
    {
      name: 'can_create_tracks',
      type: 'checkbox',
      defaultValue: false,
      label: 'Can Create Tracks',
      admin: {
        description: '允许创建新的曲目条目',
      },
    },
  ],
}