import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { TrackDetailClient } from './page.client'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface Props {
  params: {
    slug: string
  }
}

export default async function TrackDetailPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({
    config: configPromise,
  })

  const trackResult = await payload.find({
    collection: 'tracks',
    where: {
      slug: {
        equals: slug,
      },
    },
    depth: 2,
  })

  if (!trackResult.docs.length) {
    notFound()
  }

  const track = trackResult.docs[0]

  const versions = await payload.find({
    collection: 'track-versions',
    where: {
      track: {
        equals: track.id,
      },
    },
    depth: 2,
  })

  // 转换类型以匹配客户端接口
  const convertedTrack = {
    ...track,
    id: String(track.id),
  } as any

  const convertedVersions = versions.docs.map((version) => ({
    ...version,
    id: String(version.id),
    track: String(version.track),
  })) as any[]

  return <TrackDetailClient track={convertedTrack} initialVersions={convertedVersions} />
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `${slug} - 曲目详情`,
    description: '查看曲目详细信息和所有版本',
  }
}
