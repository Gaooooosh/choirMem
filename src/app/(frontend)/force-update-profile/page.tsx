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

  // 检查用户是否需要强制更新信息
  // 如果用户邮箱包含 @example.com 或者其他临时邮箱标识，则需要更新
  const needsUpdate = user.email?.includes('@example.com') || false
  
  if (!needsUpdate) {
    redirect('/')
  }

  return <ForceUpdateProfileClient user={user} />
}