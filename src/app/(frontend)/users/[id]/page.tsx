import React from 'react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import { UserProfileClient } from './page.client'
import type { User } from '@/payload-types'

interface UserProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params
  const payload = await getPayload({ config })

  try {
    // 获取用户信息
    const user = await payload.findByID({
      collection: 'users',
      id,
      depth: 2,
    }) as User

    if (!user) {
      notFound()
    }

    // 获取用户的文章
    const userArticles = await payload.find({
      collection: 'articles',
      where: {
        author: {
          equals: user.id,
        },
        status: {
          equals: 'published',
        },
      },
      limit: 10,
      sort: '-createdAt',
      depth: 1,
    })

    // 获取用户上传的曲谱版本
    const userTracks = await payload.find({
      collection: 'track-versions',
      where: {
        creator: {
          equals: user.id,
        },
      },
      limit: 10,
      sort: '-createdAt',
      depth: 2,
    })

    return (
      <UserProfileClient
        user={user}
        articles={userArticles.docs}
        tracks={userTracks.docs}
        articlesTotal={userArticles.totalDocs}
        tracksTotal={userTracks.totalDocs}
      />
    )
  } catch (error) {
    console.error('Error fetching user profile:', error)
    notFound()
  }
}

export async function generateMetadata({ params }: UserProfilePageProps) {
  const { id } = await params
  const payload = await getPayload({ config })

  try {
    const user = await payload.findByID({
      collection: 'users',
      id,
    }) as User

    if (!user) {
      return {
        title: '用户不存在',
      }
    }

    return {
      title: `${user.name || user.username} - 个人主页`,
      description: user.bio ? '查看用户的个人简介、发表的文章和上传的曲谱' : `${user.name || user.username}的个人主页`,
    }
  } catch (error) {
    return {
      title: '用户主页',
    }
  }
}