import React from 'react'
import { Metadata } from 'next'
import { ArticlesClient } from './page.client'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const metadata: Metadata = {
  title: '署名文章 - 爱乐爱家',
  description: '合唱团成员发表的文章、心得和分享',
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const payload = await getPayload({ config: configPromise })
  const page = parseInt(searchParams.page || '1', 10)

  const articles = await payload.find({
    collection: 'articles',
    where: {
      status: {
        equals: 'published',
      },
    },
    sort: '-createdAt',
    limit: 12,
    page,
    depth: 2,
  })

  return <ArticlesClient articles={articles} />
}