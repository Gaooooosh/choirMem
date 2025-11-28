import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getMeUser } from '@/utilities/getMeUser'
import { ForceUpdateProfileClient } from './page.client'

export const metadata: Metadata = {
  title: '完善个人信息 - 合唱团记忆',
  description: '首次登录需要完善个人信息',
}

export default async function ForceUpdateProfilePage() {
  const { user } = await getMeUser()

  if (!user) {
    redirect('/login')
  }

  const needsPasswordReset = user.needs_password_reset === true
  const needsUpdate = user.email?.includes('@example.com') || false

  if (needsPasswordReset || needsUpdate) {
    redirect('/migration-help')
  }

  return <ForceUpdateProfileClient user={user} />
}
