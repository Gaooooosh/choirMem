import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleDetailClient } from './page.client'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Article as PayloadArticle, User } from '@/payload-types'

interface ArticlePageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const payload = await getPayload({ config: configPromise })
  const resolvedParams = await params

  try {
    const article = await payload.findByID({
      collection: 'articles',
      id: resolvedParams.id,
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
  const resolvedParams = await params

  try {
    const article = await payload.findByID({
      collection: 'articles',
      id: resolvedParams.id,
      depth: 2,
    })

    if (!article || article.status !== 'published') {
      notFound()
    }

    // Transform the article data to match the client interface
    const contentType = ((article as any).content_type || 'richtext') as 'richtext' | 'markdown'
    const content = article.content
    
    const transformedArticle = {
      id: article.id,
      title: article.title,
      content: content,
      contentType: contentType,
      status: (article.status || 'draft') as 'draft' | 'published',
      cover_image: article.cover_image && typeof article.cover_image === 'object' ? {
         id: article.cover_image.id,
         url: article.cover_image.url || undefined,
         alt: article.cover_image.alt || undefined
       } : undefined,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      author: typeof article.author === 'number' 
        ? { id: article.author, email: '', username: '' }
        : {
            id: article.author.id,
            email: article.author.email,
            username: article.author.username || article.author.name || ''
          }
    }

    return <ArticleDetailClient article={transformedArticle} />
  } catch {
    notFound()
  }
}
