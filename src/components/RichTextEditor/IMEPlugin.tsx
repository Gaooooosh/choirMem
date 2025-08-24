'use client'

import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getSelection, $isRangeSelection } from 'lexical'

/**
 * IME插件 - 处理中文输入法的composition事件
 * 解决输入时光标换行和拼音字母残留的问题
 */
export default function IMEPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    let isComposing = false
    let compositionData = ''

    const handleCompositionStart = (event: CompositionEvent) => {
      isComposing = true
      compositionData = ''
    }

    const handleCompositionUpdate = (event: CompositionEvent) => {
      if (!isComposing) return
      
      compositionData = event.data || ''
    }

    const handleCompositionEnd = (event: CompositionEvent) => {
      if (!isComposing) return
      
      isComposing = false
      
      // 不阻止默认行为，让浏览器自然处理中文输入
      // 只清理状态
      compositionData = ''
    }

    const handleInput = (event: InputEvent) => {
      // 在输入法组合期间，不阻止input事件，让浏览器自然处理
      // 这样可以保持正确的光标位置和输入行为
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // 完全不干预按键事件，让浏览器自然处理
      // 只用于跟踪状态，不阻止任何按键
    }

    // 获取编辑器的DOM元素
    const editorElement = editor.getRootElement()
    if (!editorElement) return

    // 注册事件监听器
    const unregister = editor.registerRootListener(
      (rootElement: null | HTMLElement, prevRootElement: null | HTMLElement) => {
        if (prevRootElement) {
          prevRootElement.removeEventListener('compositionstart', handleCompositionStart)
          prevRootElement.removeEventListener('compositionupdate', handleCompositionUpdate)
          prevRootElement.removeEventListener('compositionend', handleCompositionEnd)
          prevRootElement.removeEventListener('input', handleInput as EventListener)
          prevRootElement.removeEventListener('keydown', handleKeyDown)
        }
        
        if (rootElement) {
          rootElement.addEventListener('compositionstart', handleCompositionStart)
          rootElement.addEventListener('compositionupdate', handleCompositionUpdate)
          rootElement.addEventListener('compositionend', handleCompositionEnd)
          rootElement.addEventListener('input', handleInput as EventListener, { capture: true })
          rootElement.addEventListener('keydown', handleKeyDown, { capture: true })
        }
      }
    )

    return () => {
      unregister()
      
      // 清理事件监听器
      if (editorElement) {
        editorElement.removeEventListener('compositionstart', handleCompositionStart)
        editorElement.removeEventListener('compositionupdate', handleCompositionUpdate)
        editorElement.removeEventListener('compositionend', handleCompositionEnd)
        editorElement.removeEventListener('input', handleInput as EventListener)
        editorElement.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [editor])

  return null
}