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

export interface VideoPayload {
  src: string
  key?: NodeKey
  width?: number
  height?: number
  title?: string
}

function $convertVideoElement(domNode: Node): null | DOMConversionOutput {
  const video = domNode as HTMLVideoElement | HTMLIFrameElement
  if ('src' in video && video.src) {
    const { src, width, height } = video
    const node = $createVideoNode({ src, width: Number(width) || 560, height: Number(height) || 315 })
    return { node }
  }
  return null
}

export type SerializedVideoNode = Spread<
  {
    src: string
    width?: number
    height?: number
    title?: string
  },
  SerializedLexicalNode
>

export class VideoNode extends DecoratorNode<React.JSX.Element> {
  __src: string
  __width: number
  __height: number
  __title: string

  static getType(): string {
    return 'video'
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(
      node.__src,
      node.__width,
      node.__height,
      node.__title,
      node.__key,
    )
  }

  static importJSON(serializedNode: SerializedVideoNode): VideoNode {
    const { src, width, height, title } = serializedNode
    const node = $createVideoNode({
      src,
      width,
      height,
      title,
    })
    return node
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('iframe')
    element.setAttribute('src', this.__src)
    element.setAttribute('width', this.__width.toString())
    element.setAttribute('height', this.__height.toString())
    element.setAttribute('frameborder', '0')
    element.setAttribute('allowfullscreen', 'true')
    if (this.__title) {
      element.setAttribute('title', this.__title)
    }
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      iframe: (node: Node) => ({
        conversion: $convertVideoElement,
        priority: 0,
      }),
      video: (node: Node) => ({
        conversion: $convertVideoElement,
        priority: 0,
      }),
    }
  }

  constructor(
    src: string,
    width: number = 560,
    height: number = 315,
    title: string = '',
    key?: NodeKey,
  ) {
    super(key)
    this.__src = src
    this.__width = width
    this.__height = height
    this.__title = title
  }

  exportJSON(): SerializedVideoNode {
    return {
      src: this.getSrc(),
      width: this.__width,
      height: this.__height,
      title: this.__title,
      type: 'video',
      version: 1,
    }
  }

  setSize(width: number, height: number): void {
    const writable = this.getWritable()
    writable.__width = width
    writable.__height = height
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    const theme = config.theme
    const className = theme.video
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

  getTitle(): string {
    return this.__title
  }

  decorate(): React.JSX.Element {
    return (
      <VideoComponent
        src={this.__src}
        width={this.__width}
        height={this.__height}
        title={this.__title}
        nodeKey={this.getKey()}
      />
    )
  }
}

export function $createVideoNode({
  src,
  width = 560,
  height = 315,
  title = '',
  key,
}: VideoPayload): VideoNode {
  return $applyNodeReplacement(
    new VideoNode(src, width, height, title, key),
  )
}

export function $isVideoNode(
  node: LexicalNode | null | undefined,
): node is VideoNode {
  return node instanceof VideoNode
}

interface VideoComponentProps {
  src: string
  width: number
  height: number
  title: string
  nodeKey: NodeKey
}

function VideoComponent({
  src,
  width,
  height,
  title,
  nodeKey,
}: VideoComponentProps): React.JSX.Element {
  const videoRef = useRef<null | HTMLIFrameElement>(null)
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const [editor] = useLexicalComposerContext()
  const [isLoadError, setIsLoadError] = useState<boolean>(false)
  const [isResizing, setIsResizing] = useState<boolean>(false)
  const [showControls, setShowControls] = useState<boolean>(false)
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left')
  const [showPreview, setShowPreview] = useState<boolean>(true)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const $onDelete = useCallback(
    (payload: KeyboardEvent) => {
      return editor.getEditorState().read(() => {
        if (isSelected && $isNodeSelection($getSelection())) {
          const event: KeyboardEvent = payload
          event.preventDefault()
          const node = $getNodeByKey(nodeKey)
          if ($isVideoNode(node)) {
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
        const buttonElem = videoRef.current
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
      if (videoRef.current === document.activeElement) {
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
      if (event.target === videoRef.current) {
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
    const startWidth = videoRef.current?.offsetWidth || 0
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const newWidth = Math.max(200, Math.min(800, startWidth + deltaX))
      const aspectRatio = 9 / 16 // 16:9 aspect ratio
      const newHeight = newWidth * aspectRatio
      
      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isVideoNode(node)) {
          node.setSize(newWidth, newHeight)
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

  // Update draggable state when selection changes
  useEffect(() => {
    if (isSelected) {
      editor.getEditorState().read(() => {
        const selection = $getSelection()
        setDraggable($isNodeSelection(selection))
      })
    } else {
      setDraggable(false)
    }
  }, [isSelected, editor])

  // 处理不同类型的视频URL和获取缩略图
  const getVideoInfo = (url: string) => {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0]
      if (videoId) {
        return {
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          platform: 'YouTube',
          videoId
        }
      }
    }
    // Vimeo
    else if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0]
      if (videoId) {
        return {
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          thumbnail: `https://vumbnail.com/${videoId}.jpg`,
          platform: 'Vimeo',
          videoId
        }
      }
    }
    // Bilibili
    else if (url.includes('bilibili.com')) {
      const bvMatch = url.match(/BV[a-zA-Z0-9]+/)
      if (bvMatch) {
        return {
          embedUrl: `https://player.bilibili.com/player.html?bvid=${bvMatch[0]}`,
          thumbnail: '', // Bilibili缩略图需要API获取
          platform: 'Bilibili',
          videoId: bvMatch[0]
        }
      }
    }
    // 腾讯视频
    else if (url.includes('v.qq.com')) {
      const videoId = url.match(/vid=([^&]+)/)?.[1] || url.split('/').pop()?.split('.')[0]
      if (videoId) {
        return {
          embedUrl: `https://v.qq.com/txp/iframe/player.html?vid=${videoId}`,
          thumbnail: '',
          platform: '腾讯视频',
          videoId
        }
      }
    }
    return {
      embedUrl: url,
      thumbnail: '',
      platform: '其他',
      videoId: ''
    }
  }

  const videoInfo = getVideoInfo(src)
  const isDirectVideo = src.match(/\.(mp4|webm|ogg)$/i)

  return (
    <div 
      draggable={draggable}
      className={cn(
        'relative my-4 group',
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
        {/* 视频预览/播放器 */}
        {showPreview && videoInfo.thumbnail && !isDirectVideo ? (
          <div 
            className={cn(
              'relative cursor-pointer transition-all duration-200',
              isFocused && 'ring-2 ring-blue-500 ring-offset-2',
              isDark && isFocused && 'ring-offset-gray-800'
            )}
            style={{ width, height }}
            onClick={() => setShowPreview(false)}
          >
            <img
              src={videoInfo.thumbnail}
              alt={title || '视频缩略图'}
              className="w-full h-full object-cover rounded"
              onError={() => setShowPreview(false)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              {videoInfo.platform}
            </div>
          </div>
        ) : (
          <div className={cn(
            'relative',
            isFocused && 'ring-2 ring-blue-500 ring-offset-2',
            isDark && isFocused && 'ring-offset-gray-800'
          )}>
            {isDirectVideo ? (
              <video
                ref={videoRef as any}
                className="max-w-full h-auto"
                width={width}
                height={height}
                controls
                onError={() => setIsLoadError(true)}
              >
                <source src={src} type="video/mp4" />
                您的浏览器不支持视频标签。
              </video>
            ) : (
              <iframe
                ref={videoRef}
                className="max-w-full"
                width={width}
                height={height}
                src={videoInfo.embedUrl}
                title={title || '嵌入视频'}
                frameBorder="0"
                allowFullScreen
                onError={() => setIsLoadError(true)}
              />
            )}
          </div>
        )}
        
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
        
        {/* 视频控制工具栏 */}
        {(isFocused || showControls) && (
          <div className={cn(
            'absolute -top-10 left-0 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-10',
            isDark && 'bg-gray-800 border-gray-600'
          )}>
            {/* 预览/播放切换 */}
            {videoInfo.thumbnail && !isDirectVideo && (
              <>
                <button
                  className={cn(
                    'p-1 rounded text-xs hover:bg-gray-100',
                    showPreview && 'bg-blue-100 text-blue-600',
                    isDark && 'hover:bg-gray-700',
                    isDark && showPreview && 'bg-blue-900 text-blue-400'
                  )}
                  onClick={() => setShowPreview(!showPreview)}
                  title={showPreview ? '播放视频' : '显示预览'}
                >
                  {showPreview ? '▶' : '🖼'}
                </button>
                <div className={cn('w-px h-4 mx-1', isDark ? 'bg-gray-600' : 'bg-gray-300')} />
              </>
            )}
            
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
            
            {/* 在新窗口打开 */}
            <button
              className={cn(
                'p-1 rounded text-xs hover:bg-gray-100',
                isDark && 'hover:bg-gray-700'
              )}
              onClick={() => window.open(src, '_blank')}
              title="在新窗口打开"
            >
              ↗
            </button>
            
            {/* 删除按钮 */}
            <button
              className={cn(
                'p-1 rounded text-xs text-red-600 hover:bg-red-50',
                isDark && 'text-red-400 hover:bg-red-900/20'
              )}
              onClick={() => {
                editor.update(() => {
                  const node = $getNodeByKey(nodeKey)
                  if ($isVideoNode(node)) {
                    node.remove()
                  }
                })
              }}
              title="删除视频"
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
            视频加载失败
          </span>
        </div>
      )}
    </div>
  )
}

export const INSERT_VIDEO_COMMAND: LexicalCommand<VideoPayload> = createCommand('INSERT_VIDEO_COMMAND')