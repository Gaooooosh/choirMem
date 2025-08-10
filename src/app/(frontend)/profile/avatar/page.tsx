import React from 'react'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getMeUser } from '@/utilities/getMeUser'
import AvatarConfigClient from './page.client'

export const metadata: Metadata = {
  title: '头像设置 - 合唱团成员管理系统',
  description: '设置您的个人头像',
}

export default async function AvatarConfigPage() {
  const payload = await getPayload({ config: configPromise })
  const { user } = await getMeUser()

  if (!user) {
    redirect('/login')
  }

  // 获取完整的用户信息
  const fullUser = await payload.findByID({
    collection: 'users',
    id: user.id,
    depth: 2,
  })

  if (!fullUser) {
    notFound()
  }

  return <AvatarConfigClient user={fullUser} />
}