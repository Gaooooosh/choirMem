import React from 'react'
import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getMeUser } from '@/utilities/getMeUser'
import { ArticleEditClient } from './page.client'

interface ArticleEditPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: ArticleEditPageProps): Promise<Metadata> {
  const payload = await getPayload({ config: configPromise })

  try {
    const article = await payload.findByID({
      collection: 'articles',
      id: params.id,
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

    // 确保文章状态有默认值并处理cover_image类型
    const articleWithStatus = {
      ...article,
      status: article.status || 'draft' as 'draft' | 'published',
      cover_image: typeof article.cover_image === 'object' && article.cover_image && 'url' in article.cover_image 
        ? {
            id: article.cover_image.id,
            url: article.cover_image.url || undefined,
            alt: article.cover_image.alt || undefined
          }
        : typeof article.cover_image === 'number' 
          ? article.cover_image 
          : null
    }

    return <ArticleEditClient user={userResult.user} article={articleWithStatus} />
  } catch {
    notFound()
  }
}