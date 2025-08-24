import React from 'react'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getMeUser } from '@/utilities/getMeUser'
import { ArticleEditClient } from './page.client'

interface ArticleEditPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: ArticleEditPageProps): Promise<Metadata> {
  const payload = await getPayload({ config: configPromise })
  const { id } = await params

  try {
    const article = await payload.findByID({
      collection: 'articles',
      id: id,
      depth: 2,
    })

    if (!article) {
      return {
        title: '文章未找到 - 爱乐爱家',
      }
    }

    return {
      title: `编辑 ${article.title} - 爱乐爱家`,
    }
  } catch {
    return {
      title: '文章未找到 - 爱乐爱家',
    }
  }
}

export default async function ArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const payload = await getPayload({ config: configPromise })
    
    // 获取当前用户
    const userResult = await getMeUser({
      nullUserRedirect: '/login?redirect=' + encodeURIComponent(`/articles/${resolvedParams.id}/edit`),
    })

    if (!userResult.user) {
      redirect('/login?redirect=' + encodeURIComponent(`/articles/${resolvedParams.id}/edit`))
    }

    // 获取文章
    const article = await payload.findByID({
      collection: 'articles',
      id: resolvedParams.id,
      depth: 2,
    })

    if (!article) {
      notFound()
    }

    // 检查是否是文章作者或管理员
    const isAuthor = typeof article.author === 'object' && article.author.id === userResult.user.id
    const isAdmin = userResult.user.is_admin || false
    
    if (!isAuthor && !isAdmin) {
      redirect('/articles/' + resolvedParams.id)
    }

    // Transform the article data to match the client interface
    const contentType = ((article as any).content_type || 'richtext') as 'richtext' | 'markdown'
    const content = article.content
    
    const articleWithStatus = {
      id: article.id,
      title: article.title,
      content: content || '', // Ensure content is never null
      contentType: contentType,
      status: article.status || 'draft' as 'draft' | 'published',
      cover_image: typeof article.cover_image === 'object' && article.cover_image && 'url' in article.cover_image 
        ? {
            id: article.cover_image.id,
            url: article.cover_image.url || undefined,
            alt: article.cover_image.alt || undefined
          }
        : typeof article.cover_image === 'number' 
          ? article.cover_image 
          : null,
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

    return <ArticleEditClient user={userResult.user} article={articleWithStatus} />
  } catch {
    notFound()
  }
}