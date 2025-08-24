import React from 'react'
import { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { ArticlesClient } from './page.client'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Article, User } from '@/payload-types'

export const metadata: Metadata = {
  title: '署名文章',
  description: '浏览所有署名文章',
}

type Props = {
  searchParams: Promise<{ page?: string }>
}

// Define the client article interface to match what ArticlesClient expects
interface ClientArticle {
  id: number
  title: string
  author: {
    id: number
    username?: string
    email: string
  }
  content: any
  contentType: 'richtext' | 'markdown'
  status: 'draft' | 'published'
  cover_image?: {
    id: number
    url?: string | null
    alt?: string | null
  }
  createdAt: string
  updatedAt: string
}

interface ClientArticlesData {
  docs: ClientArticle[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

export default async function ArticlesPage({ searchParams }: Props) {
  const payload = await getPayload({ config: configPromise })
  const { isEnabled: isDraftMode } = await draftMode()
  
  const resolvedSearchParams = await searchParams
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  
  const articles = await payload.find({
    collection: 'articles',
    draft: isDraftMode,
    limit: 12,
    page,
    sort: '-createdAt',
    depth: 2
  })

  // Transform the articles data to match the client interface
  const transformedArticles: ClientArticlesData = {
    docs: articles.docs.map(article => {
      const author = article.author
      const coverImage = article.cover_image
      
      const contentType = ((article as any).content_type || 'richtext') as 'richtext' | 'markdown'
      const content = contentType === 'markdown' 
        ? article.content 
        : (article as any).rich_content || article.content
      
      return {
        id: article.id,
        title: article.title,
        content: content,
        contentType: contentType,
        status: (article.status || 'draft') as 'draft' | 'published',
        cover_image: coverImage && typeof coverImage === 'object' ? {
          id: coverImage.id,
          url: coverImage.url || undefined,
          alt: coverImage.alt || undefined
        } : undefined,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        author: typeof author === 'number' 
          ? { id: author, email: '', username: '' }
          : {
              id: author.id,
              email: author.email,
              username: author.username || author.name || ''
            }
      }
    }),
    totalDocs: articles.totalDocs || 0,
    limit: articles.limit || 12,
    totalPages: articles.totalPages || 1,
    page: articles.page || 1,
    pagingCounter: articles.pagingCounter || 1,
    hasPrevPage: articles.hasPrevPage || false,
    hasNextPage: articles.hasNextPage || false,
    prevPage: articles.prevPage || null,
    nextPage: articles.nextPage || null
  }

  return <ArticlesClient articles={transformedArticles} />
}