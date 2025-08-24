'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical'
import {
  $isHeadingNode,
  $createHeadingNode,
  HeadingTagType,
} from '@lexical/rich-text'
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
} from '@lexical/list'
import { $isQuoteNode, $createQuoteNode } from '@lexical/rich-text'
import { $isLinkNode, $createLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { $isCodeNode, $createCodeNode } from '@lexical/code'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $setBlocksType } from '@lexical/selection'
import { $createParagraphNode, $getNodeByKey, $insertNodes } from 'lexical'
import { cn } from '@/utilities/ui'
import { useTheme } from '@/providers/Theme'
import ImageUpload from './ImageUpload'
import { $createImageNode, INSERT_IMAGE_COMMAND } from './ImageNode'
import { $createVideoNode, INSERT_VIDEO_COMMAND } from './VideoNode'
import { INSERT_ENHANCED_CODE_COMMAND } from './CodeNode'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Image,
  Link,
  Video,
  Undo,
  Redo,
  Indent,
  Outdent,
  Code,
} from 'lucide-react'

const LowPriority = 1

function Divider() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <div
      className={cn(
        'w-px h-6 mx-1',
        isDark ? 'bg-white/20' : 'bg-gray-300'
      )}
    />
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  children: React.ReactNode
  title?: string
}

function ToolbarButton({ onClick, isActive, children, title }: ToolbarButtonProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClick()
  }, [onClick])
  
  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      className={cn(
        'p-2 rounded transition-all duration-200 flex items-center justify-center',
        'hover:scale-105 active:scale-95',
        isActive
          ? isDark
            ? 'bg-blue-600 text-white'
            : 'bg-blue-500 text-white'
          : isDark
          ? 'hover:bg-white/10 text-gray-300'
          : 'hover:bg-gray-100 text-gray-700'
      )}
    >
      {children}
    </button>
  )
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [blockType, setBlockType] = useState('paragraph')
  const [isLink, setIsLink] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        // Update text format
        setIsBold(selection.hasFormat('bold'))
        setIsItalic(selection.hasFormat('italic'))
        setIsUnderline(selection.hasFormat('underline'))
        setIsStrikethrough(selection.hasFormat('strikethrough'))
        
        // Update link status
        const node = selection.anchor.getNode()
        const parent = node.getParent()
        setIsLink($isLinkNode(parent) || $isLinkNode(node))

        // Update block type
        const anchorNode = selection.anchor.getNode()
        const element =
          anchorNode.getKey() === 'root'
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow()
        const elementKey = element.getKey()
        const elementDOM = editor.getElementByKey(elementKey)

        if (elementDOM !== null) {
          if ($isListNode(element)) {
            const parentList = $getNodeByKey(elementKey)
            const type = (parentList as ListNode).getListType()
            setBlockType(type)
          } else {
            let type: string
            if ($isHeadingNode(element)) {
              type = element.getTag()
            } else if ($isQuoteNode(element)) {
              type = 'quote'
            } else if ($isCodeNode(element)) {
              type = 'code'
            } else {
              // For paragraph nodes and other block elements
              type = element.getType() === 'root' ? 'paragraph' : element.getType()
            }
            setBlockType(type)
          }
        }
      }
    })
  }, [editor])

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        updateToolbar()
        return false
      },
      LowPriority
    )
  }, [editor, updateToolbar])

  const formatText = (format: 'bold' | 'italic' | 'underline' | 'strikethrough') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize))
        }
      })
    }
  }

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode())
        }
      })
    }
  }

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode())
        }
      })
    }
  }

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    }
  }

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    }
  }

  const insertLink = () => {
    if (!isLink) {
      const url = prompt('请输入链接地址:')
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
      }
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    }
  }

  const insertImage = () => {
    setShowImageUpload(true)
  }

  const handleImageUpload = (imageUrl: string) => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const imageNode = $createImageNode({
          altText: '插入的图片',
          src: imageUrl,
          maxWidth: 500,
        })
        $insertNodes([imageNode])
      }
    })
  }

  const handleImageUploadClose = () => {
    setShowImageUpload(false)
  }

  const insertVideo = () => {
    const url = prompt('请输入视频地址 (支持 YouTube, Bilibili 等):')
    if (url) {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          const videoNode = $createVideoNode({
            src: url,
            width: 560,
            height: 315,
            title: '嵌入视频',
          })
          $insertNodes([videoNode])
        }
      })
    }
  }

  const handleUndo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined)
  }

  const handleRedo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined)
  }

  const handleIndent = () => {
    editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
  }

  const handleOutdent = () => {
    editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
  }

  const formatCodeBlock = () => {
    editor.dispatchCommand(INSERT_ENHANCED_CODE_COMMAND, {
      code: '',
      language: 'text'
    })
  }

  return (
    <>
      <div
        className={cn(
          'toolbar flex items-center gap-1 p-2 border-b',
          isDark
            ? 'bg-white/5 border-white/10'
            : 'bg-gray-50 border-gray-200'
        )}
      >
      {/* History */}
      <ToolbarButton
        onClick={handleUndo}
        title="撤销 (Ctrl+Z)"
      >
        <Undo size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={handleRedo}
        title="重做 (Ctrl+Y)"
      >
        <Redo size={16} />
      </ToolbarButton>

      <Divider />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => formatText('bold')}
        isActive={isBold}
        title="粗体 (Ctrl+B)"
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText('italic')}
        isActive={isItalic}
        title="斜体 (Ctrl+I)"
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText('underline')}
        isActive={isUnderline}
        title="下划线 (Ctrl+U)"
      >
        <Underline size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatText('strikethrough')}
        isActive={isStrikethrough}
        title="删除线"
      >
        <Strikethrough size={16} />
      </ToolbarButton>

      <Divider />

      {/* Block Formatting */}
      <ToolbarButton
        onClick={formatParagraph}
        isActive={blockType === 'paragraph'}
        title="段落"
      >
        <Type size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatHeading('h1')}
        isActive={blockType === 'h1'}
        title="标题 1"
      >
        <Heading1 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatHeading('h2')}
        isActive={blockType === 'h2'}
        title="标题 2"
      >
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatHeading('h3')}
        isActive={blockType === 'h3'}
        title="标题 3"
      >
        <Heading3 size={16} />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={formatBulletList}
        isActive={blockType === 'bullet'}
        title="无序列表"
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={formatNumberedList}
        isActive={blockType === 'number'}
        title="有序列表"
      >
        <ListOrdered size={16} />
      </ToolbarButton>

      <Divider />

      {/* Quote */}
      <ToolbarButton
        onClick={formatQuote}
        isActive={blockType === 'quote'}
        title="引用"
      >
        <Quote size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={formatCodeBlock}
        isActive={blockType === 'code'}
        title="代码块"
      >
        <Code size={16} />
      </ToolbarButton>

      <Divider />

      {/* Indent */}
      <ToolbarButton
        onClick={handleIndent}
        title="增加缩进 (Tab)"
      >
        <Indent size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={handleOutdent}
        title="减少缩进 (Shift+Tab)"
      >
        <Outdent size={16} />
      </ToolbarButton>

      <Divider />

      {/* Media */}
      <ToolbarButton
        onClick={insertLink}
        isActive={isLink}
        title={isLink ? "移除链接" : "插入链接"}
      >
        <Link size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={insertImage}
        title="插入图片"
      >
        <Image size={16} />
      </ToolbarButton>
        <ToolbarButton
          onClick={insertVideo}
          title="插入视频"
        >
          <Video size={16} />
        </ToolbarButton>
      </div>
      
      {/* Image Upload Modal */}
      {showImageUpload && (
        <ImageUpload
          onImageUpload={handleImageUpload}
          onClose={handleImageUploadClose}
        />
      )}
    </>
  )
}