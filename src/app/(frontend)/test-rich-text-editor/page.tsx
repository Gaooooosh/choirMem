'use client'

import React, { useState } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { ListItemNode, ListNode } from '@lexical/list'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { TRANSFORMERS } from '@lexical/markdown'

import { ImageNode } from '@/components/RichTextEditor/ImageNode'
import { VideoNode } from '@/components/RichTextEditor/VideoNode'
import { EnhancedCodeNode } from '@/components/RichTextEditor/CodeNode'
import ToolbarPlugin from '@/components/RichTextEditor/ToolbarPlugin'
import IMEPlugin from '@/components/RichTextEditor/IMEPlugin'

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem',
  },
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    overflowed: 'editor-text-overflowed',
    hashtag: 'editor-text-hashtag',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough: 'editor-text-underlineStrikethrough',
    code: 'editor-text-code',
  },
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-tokenAttr',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenProperty',
    builtin: 'editor-tokenSelector',
    cdata: 'editor-tokenComment',
    char: 'editor-tokenSelector',
    class: 'editor-tokenFunction',
    'class-name': 'editor-tokenFunction',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenProperty',
    deleted: 'editor-tokenProperty',
    doctype: 'editor-tokenComment',
    entity: 'editor-tokenOperator',
    function: 'editor-tokenFunction',
    important: 'editor-tokenVariable',
    inserted: 'editor-tokenSelector',
    keyword: 'editor-tokenAttr',
    namespace: 'editor-tokenVariable',
    number: 'editor-tokenProperty',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenComment',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenVariable',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenSelector',
    symbol: 'editor-tokenProperty',
    tag: 'editor-tokenProperty',
    url: 'editor-tokenOperator',
    variable: 'editor-tokenVariable',
  },
}

function onError(error: Error) {
  console.error(error)
}

export default function TestRichTextEditorPage() {
  const [editorState, setEditorState] = useState('')
  const [testResults, setTestResults] = useState<string[]>([])

  const initialConfig = {
    namespace: 'TestEditor',
    theme,
    onError,
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
      ImageNode,
      VideoNode,
      EnhancedCodeNode,
    ],
  }

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">富文本编辑器测试页面</h1>
        <p className="text-gray-600">
          测试 Lexical 编辑器中的图片上传功能，验证是否还有 "Unable to find an active editor state" 错误。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 编辑器区域 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">富文本编辑器</h2>
          
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <LexicalComposer initialConfig={initialConfig}>
              <ToolbarPlugin />
              <div className="relative">
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable 
                      className="min-h-[300px] p-4 outline-none" 
                      style={{
                        caretColor: 'rgb(5, 5, 5)',
                      }}
                    />
                  }
                  placeholder={
                    <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                      开始输入内容，或点击工具栏上传图片...
                    </div>
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <AutoFocusPlugin />
                <LinkPlugin />
                <ListPlugin />
                <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                <IMEPlugin />
              </div>
            </LexicalComposer>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">测试步骤</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex items-center space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                <span>点击工具栏中的图片上传按钮</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                <span>选择或拖拽图片文件到上传区域</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                <span>观察是否出现 "Unable to find an active editor state" 错误</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">4</span>
                <span>点击图片测试选择功能（应显示蓝色边框）</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">5</span>
                <span>拖拽图片四角的控制点测试调整大小功能</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">6</span>
                <span>测试图片对齐功能（左对齐、居中、右对齐）</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">7</span>
                <span>测试图片删除功能（点击删除按钮）</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">8</span>
                <span>测试拖拽图片到不同位置的功能</span>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">预期行为：</h4>
              <ul className="text-yellow-700 space-y-1 text-sm">
                <li>• 图片上传应该成功，不出现错误</li>
                <li>• 点击图片应该显示选择状态（蓝色边框）</li>
                <li>• 选中图片时应该显示调整大小的控制点</li>
                <li>• 选中图片时应该显示对齐和删除工具栏</li>
                <li>• 拖拽控制点应该能调整图片大小</li>
                <li>• 图片应该可以拖拽到编辑器内的不同位置</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 测试结果 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">测试结果</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => addTestResult('✅ 开始测试图片上传功能')}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                开始测试
              </button>
              <button 
                onClick={() => addTestResult('✅ 图片上传成功，无错误')}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                上传成功
              </button>
              <button 
                onClick={() => addTestResult('✅ 图片选择功能正常')}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                选择正常
              </button>
              <button 
                onClick={() => addTestResult('✅ 图片拖拽和调整大小功能正常')}
                className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                拖拽正常
              </button>
              <button 
                onClick={() => addTestResult('❌ 发现问题: 请描述具体问题')}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                发现问题
              </button>
              <button 
                onClick={clearResults}
                className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                清空
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 border rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 italic">暂无测试结果，请开始测试...</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className={`text-sm font-mono p-2 rounded border ${
                    result.includes('✅') ? 'bg-green-50 border-green-200 text-green-800' :
                    result.includes('❌') ? 'bg-red-50 border-red-200 text-red-800' :
                    'bg-white border-gray-200'
                  }`}>
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">注意事项</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 如果出现控制台错误，请检查浏览器开发者工具</li>
          <li>• 测试不同格式的图片文件（JPG, PNG, GIF, WebP, SVG）</li>
          <li>• 验证图片大小限制（10MB）是否正常工作</li>
          <li>• 测试图片的对齐、调整大小、删除等功能</li>
        </ul>
      </div>
    </div>
  )
}