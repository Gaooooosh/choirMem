import React from 'react'
import { Metadata } from 'next'
import { getMeUser } from '@/utilities/getMeUser'
import MigrationHelpClient from './page.client'
import { ForceUpdateProfileClient } from '../force-update-profile/page.client'

export const metadata: Metadata = {
  title: '迁移帮助 - 合唱团记忆',
  description: '迁移用户首次登录的引导与密码设置',
}

export default async function MigrationHelpPage() {
  const { user } = await getMeUser({ nullUserRedirect: '/login' })
  const needsEmailUpdate = user.email?.includes('@example.com')
  if (needsEmailUpdate) {
    return <ForceUpdateProfileClient user={user} />
  }
  return <MigrationHelpClient user={user} />
}
