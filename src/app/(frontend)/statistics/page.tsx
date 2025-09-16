import React from 'react'
import EditStatistics from '@/app/(frontend)/components/EditStatistics'

export default function StatisticsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">编辑统计</h1>
        <p className="text-muted-foreground">
          查看您的编辑贡献和社区统计数据
        </p>
      </div>
      <EditStatistics />
    </div>
  )
}