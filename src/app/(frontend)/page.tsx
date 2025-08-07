import React from 'react'
import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { HomeClient } from './components/HomeClient'

export default async function HomePage() {
  const payload = await getPayload({
    config: configPromise,
  })

  // 获取曲目数据作为首页内容
  const tracks = await payload.find({
    collection: 'tracks',
    limit: 20, // 首次加载20个
  })

  // 转换Payload Track类型到客户端Track类型
  const clientTracks = tracks.docs.map((track) => ({
    id: track.id.toString(),
    title: track.title,
    description: track.description,
    slug: track.slug,
    createdAt: track.createdAt,
  }))

  return <HomeClient initialTracks={clientTracks} hasMore={tracks.hasNextPage} />
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '合唱团记忆 - 首页',
    description: '探索丰富的合唱曲目资源，发现优美的音乐作品',
  }
}
