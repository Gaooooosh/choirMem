'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/utilities/ui'

// 导入highlight.js的样式
import 'highlight.js/styles/github.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // 自定义组件样式
          h1: ({ children }) => (
            <h1 className="text-4xl font-bold mb-8 mt-12 first:mt-0 text-gray-900 dark:text-white leading-tight tracking-tight" style={{ fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-3xl font-semibold mb-6 mt-10 text-gray-800 dark:text-gray-100 leading-tight tracking-tight" style={{ fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-2xl font-medium mb-4 mt-8 text-gray-800 dark:text-gray-100 leading-tight tracking-tight" style={{ fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xl font-medium mb-3 mt-6 text-gray-700 dark:text-gray-200 leading-tight tracking-tight" style={{ fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-6 leading-loose text-gray-700 dark:text-gray-300 text-lg tracking-wide whitespace-pre-wrap" style={{ fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', 'Georgia', 'Times New Roman', serif" }}>
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-6 pl-8 space-y-3 list-disc text-gray-700 dark:text-gray-300 text-lg leading-loose" style={{ fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', 'Georgia', 'Times New Roman', serif" }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-6 pl-8 space-y-3 list-decimal text-gray-700 dark:text-gray-300 text-lg leading-loose" style={{ fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', 'Georgia', 'Times New Roman', serif" }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-loose tracking-wide">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-6 py-4 mb-6 italic bg-blue-50/50 dark:bg-blue-900/20 text-gray-700 dark:text-gray-300 text-lg leading-loose rounded-r-lg" style={{ fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', 'Georgia', 'Times New Roman', serif" }}>
              {children}
            </blockquote>
          ),
          code: ({ children, className, ...props }) => {
            const isInline = !className?.includes('language-')
            if (isInline) {
              return (
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-sm text-red-600 dark:text-red-400 border border-gray-200 dark:border-gray-700" style={{ fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', 'Menlo', 'Consolas', monospace" }} {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code className={cn('block bg-gray-50 dark:bg-gray-900 p-6 rounded-xl overflow-x-auto text-sm border border-gray-200 dark:border-gray-700 leading-relaxed', className)} style={{ fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', 'Menlo', 'Consolas', monospace" }} {...props}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="mb-6 bg-gray-50 dark:bg-gray-900 p-6 rounded-xl overflow-x-auto border border-gray-200 dark:border-gray-700 shadow-sm">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 hover:decoration-blue-600 dark:hover:decoration-blue-300 transition-colors duration-200"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <div className="my-8 text-center">
              <img 
                src={src} 
                alt={alt} 
                className="max-w-full h-auto rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mx-auto"
              />
              {alt && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">{alt}</p>
              )}
            </div>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <table className="min-w-full">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-800">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wider" style={{ fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-6 py-4 text-gray-700 dark:text-gray-300 text-base leading-relaxed" style={{ fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', 'Georgia', 'Times New Roman', serif" }}>
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-12 border-t-2 border-gray-200 dark:border-gray-700 rounded-full" />
          ),
          // 支持删除线
          del: ({ children }) => (
            <del className="text-gray-500 dark:text-gray-400 line-through">
              {children}
            </del>
          ),
          // 支持强调文本
          strong: ({ children }) => (
            <strong className="font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
              {children}
            </strong>
          ),
          // 支持斜体文本
          em: ({ children }) => (
            <em className="italic text-gray-800 dark:text-gray-200" style={{ fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans CN', 'Noto Sans CJK SC', 'Georgia', 'Times New Roman', serif" }}>
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer