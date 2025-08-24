'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html'
import { $getRoot, $insertNodes, COMMAND_PRIORITY_EDITOR } from 'lexical'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { TRANSFORMERS } from '@lexical/markdown'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { ListItemNode, ListNode } from '@lexical/list'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { cn } from '@/utilities/ui'
import { useTheme } from '@/providers/Theme'
import ToolbarPlugin from './ToolbarPlugin'
import IMEPlugin from './IMEPlugin'
import { ImageNode } from './ImageNode'
import { VideoNode } from './VideoNode'
import { EnhancedCodeNode, INSERT_ENHANCED_CODE_COMMAND, $createEnhancedCodeNode } from './CodeNode'
import './styles.css'

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
    h6: 'editor-heading-h6',
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

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

// Plugin to update the editor content when value prop changes
function UpdatePlugin({ value, isComposing }: { value: string; isComposing: boolean }) {
  const [editor] = useLexicalComposerContext()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // 防止在更新过程中或IME输入过程中触发新的更新
    if (isUpdating || isComposing) return
    
    // 只在首次初始化时设置内容，之后完全由用户输入控制
    if (!isInitialized && value) {
      setIsUpdating(true)
      
      editor.update(() => {
        const root = $getRoot()
        // 清空编辑器内容
        root.clear()
        
        // 解析并插入初始内容
        try {
          const parser = new DOMParser()
          const dom = parser.parseFromString(value, 'text/html')
          const nodes = $generateNodesFromDOM(editor, dom)
          root.append(...nodes)
        } catch (error) {
          console.error('Error parsing HTML content:', error)
        }
      })
      
      setIsInitialized(true)
      setTimeout(() => setIsUpdating(false), 50)
    } else if (!isInitialized && !value) {
      // 如果没有初始值，直接标记为已初始化
      setIsInitialized(true)
    }
  }, [editor, value, isInitialized, isUpdating, isComposing])

  return null
}

function CodePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      INSERT_ENHANCED_CODE_COMMAND,
      (payload) => {
        const { code, language } = payload
        const codeNode = $createEnhancedCodeNode({ code, language })
        $insertNodes([codeNode])
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return null
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = '开始写作...',
  className,
  autoFocus = false,
}: RichTextEditorProps) {
  const { theme: currentTheme } = useTheme()
  const isDark = currentTheme === 'dark'
  const [isComposing, setIsComposing] = useState(false)

  const initialConfig = {
    namespace: 'RichTextEditor',
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

  const handleChange = useCallback(
    (editorState: any, editor: any) => {
      // 在IME输入过程中不触发onChange
      if (isComposing) return
      
      editorState.read(() => {
        const root = $getRoot()
        const htmlString = $generateHtmlFromNodes(editor, null)
        
        // 使用setTimeout进行防抖，避免频繁触发onChange
        setTimeout(() => {
          onChange?.(htmlString)
        }, 0)
      })
    },
    [onChange, isComposing]
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // 在composition期间，让浏览器自然处理按键事件
    // 不再阻止任何按键，保持正常的输入行为
  }, [])

  return (
    <div className={cn('rich-text-editor', className)}>
      <LexicalComposer initialConfig={initialConfig}>
        <div className={cn(
          'editor-container',
          'border rounded-lg overflow-hidden transition-all duration-300',
          isDark
            ? 'bg-white/10 border-white/20'
            : 'bg-white/50 border-white/40'
        )}>
          <ToolbarPlugin />
          <div className="editor-inner">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className={cn(
                    'editor-input',
                    'min-h-[300px] p-4 outline-none resize-none',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}
                  aria-placeholder={placeholder}
                  placeholder={
                    <div className={cn(
                      'editor-placeholder',
                      'absolute top-4 left-4 pointer-events-none select-none',
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    )}>
                      {placeholder}
                    </div>
                  }
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onKeyDown={handleKeyDown}
                />
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <OnChangePlugin onChange={handleChange} />
            <HistoryPlugin />
            {autoFocus && <AutoFocusPlugin />}
            <LinkPlugin />
            <ListPlugin />
            <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
            <UpdatePlugin value={value} isComposing={isComposing} />
            <CodePlugin />
            <IMEPlugin />
          </div>
        </div>
      </LexicalComposer>
    </div>
  )
}