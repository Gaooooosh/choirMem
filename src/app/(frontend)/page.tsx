import React from 'react'
import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { HomeClient } from './components/HomeClient'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  try {
    const payload = await getPayload({
      config: configPromise,
    })

    const tracks = await payload.find({
      collection: 'tracks',
      limit: 100,
    })

    const clientTracks = tracks.docs.map((track) => ({
      id: track.id.toString(),
      title: track.title,
      description: track.description,
      slug: track.slug,
      createdAt: track.createdAt,
    }))

    return <HomeClient initialTracks={clientTracks} hasMore={tracks.hasNextPage} />
  } catch {
    return <HomeClient initialTracks={[]} hasMore={false} />
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: '爱乐爱家 - 首页',
    description: '探索丰富的合唱曲目资源，发现优美的音乐作品',
  }
}
