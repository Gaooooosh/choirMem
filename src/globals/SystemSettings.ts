import type { GlobalConfig } from 'payload'

import { hasPermission } from '../access/hasPermission'

export const SystemSettings: GlobalConfig = {
  slug: 'system-settings',
  access: {
    read: hasPermission('can_manage_system_settings'),
    update: hasPermission('can_manage_system_settings'),
  },
  admin: {
    description: 'Global system settings for the choir management platform',
  },
  fields: [
    {
      name: 'registration_enabled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Allow new user registration with invitation codes',
      },
    },
    {
      name: 'homepage_photo_max',
      type: 'number',
      defaultValue: 5,
      admin: {
        description: 'Maximum number of photos to display on homepage',
      },
    },
    {
      name: 'ai_polish_prompt',
      type: 'textarea',
      admin: {
        description: 'Prompt template for AI text polishing feature',
        rows: 5,
      },
      defaultValue: '请润色以下文本，使其更加流畅自然：',
    },
  ],
}