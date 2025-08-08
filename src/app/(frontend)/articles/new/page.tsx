import React from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ArticleEditorClient } from './page.client'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getMeUser } from '@/utilities/getMeUser'

export const metadata: Metadata = {
  title: '发表文章 - 爱乐爱家',
  description: '创建新的署名文章',
}

export default async function NewArticlePage() {
  const userResult = await getMeUser({
    nullUserRedirect: '/login?redirect=/articles/new'
  })

  const payload = await getPayload({ config: configPromise })

  return <ArticleEditorClient user={userResult.user} />
}