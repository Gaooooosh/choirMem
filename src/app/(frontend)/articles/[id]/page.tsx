import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleDetailClient } from './page.client'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

interface ArticlePageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const payload = await getPayload({ config: configPromise })

  try {
    const article = await payload.findByID({
      collection: 'articles',
      id: params.id,
      depth: 2,
    })

    if (!article || article.status !== 'published') {
      return {
        title: '文章未找到 - 爱乐爱家',
      }
    }

    return {
      title: `${article.title} - 爱乐爱家`,
      description: article.content ? '查看完整文章内容' : undefined,
    }
  } catch {
    return {
      title: '文章未找到 - 爱乐爱家',
    }
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const payload = await getPayload({ config: configPromise })

  try {
    const article = await payload.findByID({
      collection: 'articles',
      id: params.id,
      depth: 2,
    })

    if (!article || article.status !== 'published') {
      notFound()
    }

    return <ArticleDetailClient article={article} />
  } catch {
    notFound()
  }
}
