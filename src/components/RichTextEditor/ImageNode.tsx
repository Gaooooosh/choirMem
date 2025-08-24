'use client'

import React from 'react'
import {
  $applyNodeReplacement,
  $createParagraphNode,
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
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
  KEY_DELETE_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { $getNodeByKey, $getSelection } from 'lexical'
import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/utilities/ui'
import { useTheme } from '@/providers/Theme'

// 简单的mergeRegister实现
function mergeRegister(...func: Array<() => void>): () => void {
  return () => {
    func.forEach((f) => f())
  }
}

export interface ImagePayload {
  altText: string
  height?: number
  key?: NodeKey
  maxWidth?: number
  src: string
  width?: number
}

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement
  if (img.src.startsWith('file:///')) {
    return null
  }
  const { alt: altText, src, width, height } = img
  const node = $createImageNode({ altText, height, src, width })
  return { node }
}

export type SerializedImageNode = Spread<
  {
    altText: string
    height?: number
    maxWidth?: number
    src: string
    width?: number
  },
  SerializedLexicalNode
>

export class ImageNode extends DecoratorNode<React.JSX.Element> {
  __src: string
  __altText: string
  __width: 'inherit' | number
  __height: 'inherit' | number
  __maxWidth: number

  static getType(): string {
    return 'image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__width,
      node.__height,
      node.__key,
    )
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, height, width, maxWidth, src } = serializedNode
    const node = $createImageNode({
      altText,
      height,
      maxWidth,
      src,
      width,
    })
    return node
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    element.setAttribute('src', this.__src)
    element.setAttribute('alt', this.__altText)
    element.setAttribute('width', this.__width.toString())
    element.setAttribute('height', this.__height.toString())
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: $convertImageElement,
        priority: 0,
      }),
    }
  }

  constructor(
    src: string,
    altText: string,
    maxWidth: number,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    key?: NodeKey,
  ) {
    super(key)
    this.__src = src
    this.__altText = altText
    this.__maxWidth = maxWidth
    this.__width = width || 'inherit'
    this.__height = height || 'inherit'
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      src: this.getSrc(),
      type: 'image',
      version: 1,
      width: this.__width === 'inherit' ? 0 : this.__width,
    }
  }

  setWidthAndHeight(
    width: 'inherit' | number,
    height: 'inherit' | number,
  ): void {
    const writable = this.getWritable()
    writable.__width = width
    writable.__height = height
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    const theme = config.theme
    const className = theme.image
    if (className !== undefined) {
      span.className = className
    }
    return span
  }

  updateDOM(): false {
    return false
  }

  getSrc(): string {
    return this.__src
  }

  getAltText(): string {
    return this.__altText
  }

  decorate(): React.JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        nodeKey={this.getKey()}
      />
    )
  }
}

export function $createImageNode({
  altText,
  height,
  maxWidth = 500,
  src,
  width,
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(src, altText, maxWidth, width, height, key),
  )
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode
}

interface ImageComponentProps {
  altText: string
  height: 'inherit' | number
  maxWidth: number
  nodeKey: NodeKey
  src: string
  width: 'inherit' | number
}

function ImageComponent({
  src,
  altText,
  nodeKey,
  width,
  height,
  maxWidth,
}: ImageComponentProps): React.JSX.Element {
  const imageRef = useRef<null | HTMLImageElement>(null)
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const [editor] = useLexicalComposerContext()
  const [isLoadError, setIsLoadError] = useState<boolean>(false)
  const [isResizing, setIsResizing] = useState<boolean>(false)
  const [showControls, setShowControls] = useState<boolean>(false)
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left')
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const $onDelete = useCallback(
    (payload: KeyboardEvent) => {
      return editor.getEditorState().read(() => {
        if (isSelected && $isNodeSelection($getSelection())) {
          const event: KeyboardEvent = payload
          event.preventDefault()
          const node = $getNodeByKey(nodeKey)
          if ($isImageNode(node)) {
            node.remove()
            return true
          }
        }
        return false
      })
    },
    [isSelected, nodeKey, editor],
  )

  const $onEnter = useCallback(
    (event: KeyboardEvent) => {
      // 在中文等输入法组合输入进行时，不拦截回车键，交由输入法处理
      if (event.isComposing) return false
      
      return editor.getEditorState().read(() => {
        const latestSelection = $getSelection()
        const buttonElem = imageRef.current
        if (
          isSelected &&
          $isNodeSelection(latestSelection) &&
          latestSelection.getNodes().length === 1
        ) {
          if (buttonElem !== null && buttonElem !== document.activeElement) {
            event.preventDefault()
            buttonElem.focus()
            return true
          }
        }
        return false
      })
    },
    [isSelected, editor],
  )

  const $onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (imageRef.current === document.activeElement) {
        const parentRootElement = editor.getRootElement()
        if (parentRootElement !== null) {
          parentRootElement.focus()
        }
        return true
      }
      return false
    },
    [editor],
  )

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload
      if (event.target === imageRef.current) {
        if (event.shiftKey) {
          setSelected(!isSelected)
        } else {
          clearSelection()
          setSelected(true)
        }
        setShowControls(true)
        return true
      }
      return false
    },
    [isSelected, setSelected, clearSelection],
  )

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    
    const startX = e.clientX
    const startWidth = imageRef.current?.offsetWidth || 0
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const newWidth = Math.max(100, Math.min(800, startWidth + deltaX))
      
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isImageNode(node)) {
          const ratio = (imageRef.current?.naturalHeight || 1) / (imageRef.current?.naturalWidth || 1)
          node.setWidthAndHeight(newWidth, newWidth * ratio)
        }
      })
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [editor, nodeKey])

  const updateAlignment = useCallback((newAlignment: 'left' | 'center' | 'right') => {
    setAlignment(newAlignment)
    // 这里可以添加更新节点对齐方式的逻辑
  }, [])

  // 点击其他地方时隐藏控制器
  useEffect(() => {
    const handleClickOutside = () => {
      if (!isSelected) {
        setShowControls(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isSelected])

  useEffect(() => {
    let isMounted = true
    const unregister = mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        $onEnter,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        $onEscape,
        COMMAND_PRIORITY_LOW,
      ),
    )

    return () => {
      isMounted = false
      unregister()
    }
  }, [clearSelection, editor, isSelected, nodeKey, $onDelete, $onEnter, $onEscape, onClick])

  const [draggable, setDraggable] = useState(false)
  const isFocused = isSelected

  // 在编辑器上下文中安全地获取选择状态
  useEffect(() => {
    const updateDraggable = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        setDraggable(isSelected && $isNodeSelection(selection))
      })
    }
    
    updateDraggable()
    
    // 监听选择变化
    const unregister = editor.registerUpdateListener(() => {
      updateDraggable()
    })
    
    return unregister
  }, [editor, isSelected])

  return (
    <div 
      draggable={draggable}
      className={cn(
        'relative inline-block group',
        alignment === 'center' && 'mx-auto',
        alignment === 'right' && 'ml-auto',
        alignment === 'left' && 'mr-auto'
      )}
      style={{
        textAlign: alignment,
        display: alignment === 'center' ? 'block' : 'inline-block',
        width: alignment === 'center' ? '100%' : 'auto'
      }}
    >
      <div className="relative inline-block">
        <img
          className={cn(
            'max-w-full h-auto cursor-default transition-all duration-200',
            isFocused && 'ring-2 ring-blue-500 ring-offset-2',
            isDark && isFocused && 'ring-offset-gray-800',
            isResizing && 'cursor-ew-resize'
          )}
          src={src}
          alt={altText}
          ref={imageRef}
          style={{
            height,
            maxWidth,
            width,
          }}
          onError={() => setIsLoadError(true)}
          draggable="false"
        />
        
        {/* 调整大小控制器 */}
        {isFocused && (
          <div
            className={cn(
              'absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-8 bg-blue-500 rounded cursor-ew-resize opacity-80 hover:opacity-100',
              isDark && 'bg-blue-400'
            )}
            onMouseDown={onResizeStart}
            title="拖拽调整大小"
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-1 h-4 bg-white rounded"></div>
            </div>
          </div>
        )}
        
        {/* 图片控制工具栏 */}
        {(isFocused || showControls) && (
          <div className={cn(
            'absolute -top-10 left-0 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-10',
            isDark && 'bg-gray-800 border-gray-600'
          )}>
            {/* 对齐控制 */}
            <button
              className={cn(
                'p-1 rounded text-xs hover:bg-gray-100',
                alignment === 'left' && 'bg-blue-100 text-blue-600',
                isDark && 'hover:bg-gray-700',
                isDark && alignment === 'left' && 'bg-blue-900 text-blue-400'
              )}
              onClick={() => updateAlignment('left')}
              title="左对齐"
            >
              ←
            </button>
            <button
              className={cn(
                'p-1 rounded text-xs hover:bg-gray-100',
                alignment === 'center' && 'bg-blue-100 text-blue-600',
                isDark && 'hover:bg-gray-700',
                isDark && alignment === 'center' && 'bg-blue-900 text-blue-400'
              )}
              onClick={() => updateAlignment('center')}
              title="居中对齐"
            >
              ↔
            </button>
            <button
              className={cn(
                'p-1 rounded text-xs hover:bg-gray-100',
                alignment === 'right' && 'bg-blue-100 text-blue-600',
                isDark && 'hover:bg-gray-700',
                isDark && alignment === 'right' && 'bg-blue-900 text-blue-400'
              )}
              onClick={() => updateAlignment('right')}
              title="右对齐"
            >
              →
            </button>
            
            <div className={cn('w-px h-4 mx-1', isDark ? 'bg-gray-600' : 'bg-gray-300')} />
            
            {/* 删除按钮 */}
            <button
              className={cn(
                'p-1 rounded text-xs text-red-600 hover:bg-red-50',
                isDark && 'text-red-400 hover:bg-red-900/20'
              )}
              onClick={() => {
                editor.update(() => {
                  const node = $getNodeByKey(nodeKey)
                  if ($isImageNode(node)) {
                    node.remove()
                  }
                })
              }}
              title="删除图片"
            >
              ×
            </button>
          </div>
        )}
      </div>
      
      {isLoadError && (
        <div className={cn(
          'flex items-center justify-center bg-gray-100 border border-gray-300 rounded p-4',
          isDark && 'bg-gray-800 border-gray-600'
        )}>
          <span className={cn('text-gray-500', isDark && 'text-gray-400')}>
            图片加载失败
          </span>
        </div>
      )}
    </div>
  )
}

// 移除自定义 KEY_* 命令导出，改用 Lexical 官方导出
// export const KEY_DELETE_COMMAND: LexicalCommand<KeyboardEvent> = createCommand('KEY_DELETE_COMMAND')
// export const KEY_BACKSPACE_COMMAND: LexicalCommand<KeyboardEvent> = createCommand('KEY_BACKSPACE_COMMAND')
// export const KEY_ENTER_COMMAND: LexicalCommand<KeyboardEvent> = createCommand('KEY_ENTER_COMMAND')
// export const KEY_ESCAPE_COMMAND: LexicalCommand<KeyboardEvent> = createCommand('KEY_ESCAPE_COMMAND')

export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> = createCommand('INSERT_IMAGE_COMMAND')