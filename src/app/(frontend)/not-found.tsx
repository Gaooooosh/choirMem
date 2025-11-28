import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-muted-foreground">页面不存在或已被移除</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
          <Link href="/search">
            <Button variant="outline">搜索内容</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

