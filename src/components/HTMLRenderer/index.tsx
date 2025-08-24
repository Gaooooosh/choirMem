'use client'

import React from 'react'
import { cn } from '@/utilities/ui'

interface HTMLRendererProps {
  content: string
  className?: string
}

export default function HTMLRenderer({ content, className }: HTMLRendererProps) {
  // Decode HTML entities if content is escaped
  const decodeHtml = (html: string) => {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
  }

  // Check if content appears to be escaped HTML
  const isEscapedHtml = content.includes('&lt;') || content.includes('&gt;') || content.includes('&quot;')
  const processedContent = isEscapedHtml ? decodeHtml(content) : content

  return (
    <div 
      className={cn(
        'html-content prose prose-xl max-w-none prose-headings:font-sans prose-headings:tracking-tight prose-p:font-serif prose-p:text-lg prose-p:leading-relaxed prose-p:mb-6',
        'prose-img:rounded-lg prose-img:shadow-lg prose-img:max-w-full prose-img:h-auto',
        'prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline',
        'prose-video:rounded-lg prose-video:shadow-lg prose-video:max-w-full prose-video:h-auto',
        'prose-iframe:rounded-lg prose-iframe:shadow-lg prose-iframe:max-w-full prose-iframe:h-auto',
        'dark:prose-invert dark:prose-a:text-blue-400',
        className
      )}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  )
}