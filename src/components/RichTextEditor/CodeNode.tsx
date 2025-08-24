'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  $applyNodeReplacement,
  $createParagraphNode,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $setSelection,
  BaseSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { $getNodeByKey } from 'lexical'
import { cn } from '@/utilities/ui'
import { useTheme } from '@/providers/Theme'
import { Copy, Check, Settings } from 'lucide-react'

export interface CodePayload {
  code: string
  language?: string
}

export type SerializedCodeNode = Spread<
  {
    code: string
    language?: string
    type: 'enhanced-code'
    version: 1
  },
  SerializedLexicalNode
>

function convertCodeElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLPreElement) {
    const codeElement = domNode.querySelector('code')
    if (codeElement) {
      const code = codeElement.textContent || ''
      const language = codeElement.className.match(/language-(\w+)/)?.[1] || 'text'
      return {
        node: $createEnhancedCodeNode({ code, language }),
      }
    }
  }
  return null
}

export class EnhancedCodeNode extends DecoratorNode<React.JSX.Element> {
  __code: string
  __language: string

  static getType(): string {
    return 'enhanced-code'
  }

  static clone(node: EnhancedCodeNode): EnhancedCodeNode {
    return new EnhancedCodeNode(node.__code, node.__language, node.__key)
  }

  constructor(code: string, language: string = 'text', key?: NodeKey) {
    super(key)
    this.__code = code
    this.__language = language
  }

  exportJSON(): SerializedCodeNode {
    return {
      code: this.getCode(),
      language: this.getLanguage(),
      type: 'enhanced-code',
      version: 1,
    }
  }

  static importJSON(serializedNode: SerializedCodeNode): EnhancedCodeNode {
    const { code, language } = serializedNode
    const node = $createEnhancedCodeNode({
      code,
      language,
    })
    return node
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('pre')
    const codeElement = document.createElement('code')
    codeElement.textContent = this.__code
    if (this.__language) {
      codeElement.className = `language-${this.__language}`
    }
    element.appendChild(codeElement)
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      pre: (node: Node) => ({
        conversion: convertCodeElement,
        priority: 1,
      }),
    }
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div')
    div.style.display = 'contents'
    return div
  }

  updateDOM(): false {
    return false
  }

  getCode(): string {
    return this.__code
  }

  getLanguage(): string {
    return this.__language
  }

  setCode(code: string): void {
    const writable = this.getWritable()
    writable.__code = code
  }

  setLanguage(language: string): void {
    const writable = this.getWritable()
    writable.__language = language
  }

  decorate(): React.JSX.Element {
    return <CodeComponent code={this.__code} language={this.__language} nodeKey={this.getKey()} />
  }
}

export function $createEnhancedCodeNode({ code, language }: CodePayload): EnhancedCodeNode {
  return $applyNodeReplacement(new EnhancedCodeNode(code, language))
}

export function $isEnhancedCodeNode(
  node: LexicalNode | null | undefined,
): node is EnhancedCodeNode {
  return node instanceof EnhancedCodeNode
}

interface CodeComponentProps {
  code: string
  language: string
  nodeKey: NodeKey
}

const SUPPORTED_LANGUAGES = [
  { value: 'text', label: '纯文本' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
  { value: 'sql', label: 'SQL' },
]

function CodeComponent({ code, language, nodeKey }: CodeComponentProps) {
  const [editor] = useLexicalComposerContext()
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const [selection, setSelection] = useState<BaseSelection | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentCode, setCurrentCode] = useState(code)
  const [currentLanguage, setCurrentLanguage] = useState(language)
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      return editor.getEditorState().read(() => {
        if (isSelected && $isNodeSelection($getSelection())) {
          const event: KeyboardEvent = payload
          event.preventDefault()
          const node = $getNodeByKey(nodeKey)
          if ($isEnhancedCodeNode(node)) {
            node.remove()
          }
        }
        return false
      })
    },
    [isSelected, nodeKey, editor],
  )

  const onEnter = useCallback(
    (event: KeyboardEvent) => {
      // 在中文等输入法组合输入进行时，不拦截回车键，交由输入法处理
      if (event.isComposing) return false
      
      editor.update(() => {
        if (isSelected && $isNodeSelection($getSelection())) {
          event.preventDefault()
          const paragraphNode = $createParagraphNode()
          $insertNodes([paragraphNode])
          paragraphNode.select()
        }
      })
      return false
    },
    [isSelected, editor],
  )

  const onEscape = useCallback(
    (event: KeyboardEvent) => {
      return editor.getEditorState().read(() => {
        if (isSelected && $isNodeSelection($getSelection())) {
          event.preventDefault()
          clearSelection()
        }
        return false
      })
    },
    [clearSelection, isSelected, editor],
  )

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload
      if (event.target === textareaRef.current || textareaRef.current?.contains(event.target as Node)) {
        return false
      }
      return false
    },
    [],
  )

  useEffect(() => {
    let isMounted = true
    const unregister = editor.registerCommand(
      CLICK_COMMAND,
      onClick,
      COMMAND_PRIORITY_LOW,
    )

    return () => {
      isMounted = false
      unregister()
    }
  }, [editor, onClick])

  useEffect(() => {
    const unregisterDelete = editor.registerCommand(
      KEY_DELETE_COMMAND,
      onDelete,
      COMMAND_PRIORITY_LOW,
    )
    
    const unregisterEnter = editor.registerCommand(
      KEY_ENTER_COMMAND,
      onEnter,
      COMMAND_PRIORITY_LOW,
    )
    
    const unregisterEscape = editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      onEscape,
      COMMAND_PRIORITY_LOW,
    )

    return () => {
      unregisterDelete()
      unregisterEnter()
      unregisterEscape()
    }
  }, [editor, onDelete, onEnter, onEscape])

  const handleCodeChange = (newCode: string) => {
    setCurrentCode(newCode)
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isEnhancedCodeNode(node)) {
        node.setCode(newCode)
      }
    })
  }

  const handleLanguageChange = (newLanguage: string) => {
    setCurrentLanguage(newLanguage)
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isEnhancedCodeNode(node)) {
        node.setLanguage(newLanguage)
      }
    })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.target as HTMLTextAreaElement
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = currentCode.substring(0, start) + '  ' + currentCode.substring(end)
      handleCodeChange(newValue)
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }

  return (
    <div
      className={cn(
        'relative group my-4 rounded-lg border transition-all duration-200',
        isDark
          ? 'bg-gray-900 border-gray-700'
          : 'bg-gray-50 border-gray-200',
        isSelected && 'ring-2 ring-blue-500 ring-opacity-50'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-2 border-b',
          isDark
            ? 'bg-gray-800 border-gray-700'
            : 'bg-gray-100 border-gray-200'
        )}
      >
        <div className="flex items-center gap-2">
          {showSettings ? (
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className={cn(
                'text-sm border rounded px-2 py-1',
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              )}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          ) : (
            <span className={cn('text-sm font-medium', isDark ? 'text-gray-300' : 'text-gray-600')}>
              {SUPPORTED_LANGUAGES.find(lang => lang.value === currentLanguage)?.label || '纯文本'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}
            title="设置"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={handleCopy}
            className={cn(
              'p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}
            title="复制代码"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={currentCode}
          onChange={(e) => handleCodeChange(e.target.value)}
          onKeyDown={handleTextareaKeyDown}
          className={cn(
            'w-full p-4 font-mono text-sm resize-none border-0 outline-none',
            'min-h-[120px] leading-relaxed',
            isDark
              ? 'bg-gray-900 text-gray-100 placeholder-gray-500'
              : 'bg-gray-50 text-gray-900 placeholder-gray-400'
          )}
          placeholder="输入代码..."
          spellCheck={false}
          style={{
            tabSize: 2,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          }}
        />
      </div>
    </div>
  )
}

export const INSERT_ENHANCED_CODE_COMMAND: LexicalCommand<CodePayload> = createCommand(
  'INSERT_ENHANCED_CODE_COMMAND',
)