'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit3, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

interface InlineEditProps {
  value: string
  onSave: (newValue: string) => Promise<void> | void
  onCancel?: () => void
  placeholder?: string
  multiline?: boolean
  className?: string
  editClassName?: string
  displayClassName?: string
  disabled?: boolean
  maxLength?: number
  minLength?: number
  validation?: (value: string) => string | null // 返回错误信息或null
  renderDisplay?: (value: string) => React.ReactNode
  autoFocus?: boolean
  saveOnBlur?: boolean
  saveOnEnter?: boolean
  showEditIcon?: boolean
  editIconPosition?: 'left' | 'right'
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  onCancel,
  placeholder = '点击编辑...',
  multiline = false,
  className = '',
  editClassName = '',
  displayClassName = '',
  disabled = false,
  maxLength,
  minLength,
  validation,
  renderDisplay,
  autoFocus = true,
  saveOnBlur = false,
  saveOnEnter = true,
  showEditIcon = true,
  editIconPosition = 'right',
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // 同步外部value变化
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value)
    }
  }, [value, isEditing])

  // 自动聚焦
  useEffect(() => {
    if (isEditing && autoFocus && inputRef.current) {
      inputRef.current.focus()
      // 选中所有文本
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select()
      } else if (inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.setSelectionRange(0, inputRef.current.value.length)
      }
    }
  }, [isEditing, autoFocus])

  const startEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setEditValue(value)
    setError(null)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditValue(value)
    setError(null)
    onCancel?.()
  }

  const validateValue = (val: string): string | null => {
    if (minLength && val.length < minLength) {
      return `最少需要 ${minLength} 个字符`
    }
    if (maxLength && val.length > maxLength) {
      return `最多允许 ${maxLength} 个字符`
    }
    if (validation) {
      return validation(val)
    }
    return null
  }

  const saveEdit = async () => {
    const trimmedValue = editValue.trim()

    // 验证
    const validationError = validateValue(trimmedValue)
    if (validationError) {
      setError(validationError)
      return
    }

    // 如果值没有变化，直接取消编辑
    if (trimmedValue === value) {
      cancelEdit()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSave(trimmedValue)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      cancelEdit()
    } else if (e.key === 'Enter' && saveOnEnter) {
      if (multiline && !e.shiftKey) {
        // 多行模式下，Shift+Enter换行，Enter保存
        e.preventDefault()
        saveEdit()
      } else if (!multiline) {
        // 单行模式下，Enter保存
        e.preventDefault()
        saveEdit()
      }
    }
  }

  const handleBlur = () => {
    if (saveOnBlur && !isLoading) {
      saveEdit()
    }
  }

  const displayValue = value || placeholder
  const isEmpty = !value

  if (isEditing) {
    const InputComponent = multiline ? Textarea : Input

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`inline-edit-container ${className}`}
      >
        <div className="space-y-2">
          <div className="relative">
            <InputComponent
              ref={inputRef as any}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={placeholder}
              disabled={isLoading}
              maxLength={maxLength}
              className={`inline-edit-input ${editClassName} ${error ? 'border-red-500' : ''}`}
              rows={multiline ? 3 : undefined}
            />
            {isLoading && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500"
            >
              {error}
            </motion.div>
          )}

          {maxLength && (
            <div className="text-xs text-gray-400 text-right">
              {editValue.length}/{maxLength}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={saveEdit} disabled={isLoading || !!error} className="h-8">
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              保存
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancelEdit}
              disabled={isLoading}
              className="h-8"
            >
              <X className="w-3 h-3" />
              取消
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`inline-edit-display group cursor-pointer ${className} ${displayClassName}`}
      onClick={startEdit}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`flex items-center gap-2 ${editIconPosition === 'left' ? 'flex-row' : 'flex-row-reverse'}`}
      >
        {showEditIcon && !disabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="text-gray-400 group-hover:text-gray-600 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </motion.div>
        )}

        <div className={`flex-1 ${isEmpty ? 'text-gray-400 italic' : ''}`}>
          {renderDisplay ? renderDisplay(displayValue) : displayValue}
        </div>
      </div>
    </motion.div>
  )
}

export default InlineEdit
