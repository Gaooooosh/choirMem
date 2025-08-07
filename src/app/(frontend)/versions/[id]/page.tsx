import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { VersionDetailClient } from './page.client'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface Props {
  params: {
    id: string
  }
}

export default async function VersionDetailPage({ params }: Props) {
  const { id } = await params
  const payload = await getPayload({
    config: configPromise,
  })

  const version = await payload.findByID({
    collection: 'track-versions',
    id: parseInt(id),
    depth: 2,
  })

  if (!version) {
    notFound()
  }

  // 获取该版本的乐谱文件
  const scores = await payload.find({
    collection: 'scores',
    where: {
      track_version: {
        equals: parseInt(id),
      },
    },
    depth: 2,
  })

  // 转换类型以匹配客户端接口
  const convertedVersion = {
    ...version,
    id: String(version.id),
  } as any

  const convertedScores = scores.docs.map((score) => ({
    ...score,
    id: String(score.id),
  })) as any[]

  return <VersionDetailClient version={convertedVersion} initialScores={convertedScores} />
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: `版本 ${id} - 版本详情`,
    description: '查看版本详细信息和乐谱文件',
  }
}
