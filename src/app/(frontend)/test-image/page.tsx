'use client'

import React, { useState } from 'react'
import RichTextEditor from '@/components/RichTextEditor'

export default function TestImagePage() {
  const [content, setContent] = useState('')

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">图片上传测试页面</h1>
      <div className="border rounded-lg p-4">
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="测试图片上传功能..."
          autoFocus
        />
      </div>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">编辑器内容:</h3>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      </div>
    </div>
  )
}