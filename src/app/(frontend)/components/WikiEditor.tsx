'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Edit3,
  Save,
  X,
  Clock,
  User,
  AlertTriangle,
  CheckCircle,
  History,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCcw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getClientSideURL } from '@/utilities/getURL'

interface WikiEditorProps {
  collection: 'tracks' | 'track-versions'
  documentId: string
  fieldName: 'description' | 'notes'
  initialContent: any
  title: string
  onContentChange?: (content: any) => void
  readOnly?: boolean
}

interface EditHistory {
  id: string
  editor: {
    id: string
    name?: string
    email: string
  }
  operation_type: 'create' | 'update' | 'rollback'
  content_diff: string
  edit_version: number
  created_at: string
  approval_status?: 'pending' | 'approved' | 'rejected'
}

interface PendingEdit {
  id: string
  editor: {
    id: string
    name?: string
    email: string
  }
  content_diff: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const payloadUrl = getClientSideURL()

export const WikiEditor: React.FC<WikiEditorProps> = ({
  collection,
  documentId,
  fieldName,
  initialContent,
  title,
  onContentChange,
  readOnly = false,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [lockedBy, setLockedBy] = useState<any>(null)
  const [lockTime, setLockTime] = useState<string | null>(null)
  const [editHistory, setEditHistory] = useState<EditHistory[]>([])
  const [pendingEdits, setPendingEdits] = useState<PendingEdit[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showPendingEdits, setShowPendingEdits] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [showRollbackDialog, setShowRollbackDialog] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<EditHistory | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [hasModeratePermission, setHasModeratePermission] = useState(false)
  
  const { toast } = useToast()
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const lockCheckInterval = useRef<NodeJS.Timeout | null>(null)
  


  // 提取文本内容
  const extractTextContent = useCallback((richTextContent: any): string => {
    if (!richTextContent) return ''
    
    if (typeof richTextContent === 'string') {
      return richTextContent
    }
    
    if (richTextContent.root && richTextContent.root.children) {
      const extractFromNode = (node: any): string => {
        if (node.type === 'text') {
          return node.text || ''
        }
        
        if (node.children && Array.isArray(node.children)) {
          return node.children.map(extractFromNode).join('')
        }
        
        return ''
      }
      
      return richTextContent.root.children.map(extractFromNode).join('\n')
    }
    
    return ''
  }, [])

  // 获取当前用户信息
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${payloadUrl}/api/users/me`, {
          credentials: 'include',
        })
        if (response.ok) {
          const userData = await response.json()
          setCurrentUser(userData.user)
          
          // 检查用户权限
          if (userData.user?.permission_groups) {
            const hasPermission = userData.user.permission_groups.some(
              (group: any) => group.can_moderate_edits
            )
            setHasModeratePermission(hasPermission)
          }
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    }
    
    fetchCurrentUser()
  }, [])

  // 初始化内容
  useEffect(() => {
    const textContent = extractTextContent(initialContent)
    setContent(textContent)
    setOriginalContent(textContent)
  }, [initialContent, extractTextContent])

  // 检查锁定状态
  const checkLockStatus = useCallback(async () => {
    try {
      const response = await fetch(`${payloadUrl}/api/wiki/lock-status?collection=${collection}&documentId=${documentId}`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsLocked(data.isLocked || false)
        setLockedBy(data.lockedBy)
        setLockTime(data.expiresAt)
      }
    } catch (error) {
      console.error('检查锁定状态失败:', error)
    }
  }, [collection, documentId])

  // 锁定文档
  const lockDocument = useCallback(async () => {
    try {
      const response = await fetch(`${payloadUrl}/api/wiki/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          collection,
          documentId,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsLocked(true)
        setLockedBy(currentUser)
        setLockTime(data.lock.expires_at)
        return true
      } else if (response.status === 409) {
        const error = await response.json()
        setIsLocked(true)
        setLockedBy(error.lockedBy)
        toast({
          title: '文档已被锁定',
          description: `文档正在被其他用户编辑`,
          variant: 'destructive',
        })
        return false
      } else {
        const error = await response.json()
        toast({
          title: '无法锁定文档',
          description: error.error || '获取编辑权限失败',
          variant: 'destructive',
        })
        return false
      }
    } catch (error) {
      console.error('锁定文档失败:', error)
      toast({
        title: '锁定失败',
        description: '无法获取编辑权限，请稍后重试',
        variant: 'destructive',
      })
      return false
    }
  }, [collection, documentId, currentUser, toast])

  // 解锁文档
  const unlockDocument = useCallback(async () => {
    try {
      await fetch('/api/wiki/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          collection,
          documentId,
        }),
      })
      
      setIsLocked(false)
      setLockedBy(null)
      setLockTime(null)
    } catch (error) {
      console.error('解锁文档失败:', error)
    }
  }, [collection, documentId])

  // 获取编辑历史
  const fetchEditHistory = useCallback(async () => {
    try {
      const response = await fetch(`${payloadUrl}/api/wiki/history?collection=${collection}&documentId=${documentId}`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setEditHistory(data.history || [])
      }
    } catch (error) {
      console.error('获取编辑历史失败:', error)
    }
  }, [collection, documentId])

  // 获取待审核编辑
  const fetchPendingEdits = useCallback(async () => {
    if (!hasModeratePermission) return
    
    try {
      const response = await fetch(`${payloadUrl}/api/pending-edits?where[collection][equals]=${collection}&where[document_id][equals]=${documentId}&where[status][equals]=pending`, {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setPendingEdits(data.docs || [])
      }
    } catch (error) {
      console.error('获取待审核编辑失败:', error)
    }
  }, [collection, documentId, hasModeratePermission])

  // 定期检查锁定状态
  useEffect(() => {
    checkLockStatus()
    
    if (isEditing) {
      lockCheckInterval.current = setInterval(() => {
        checkLockStatus()
      }, 10000) // 每10秒检查一次
    }
    
    return () => {
      if (lockCheckInterval.current) {
        clearInterval(lockCheckInterval.current)
      }
      // 组件卸载时释放锁定
      if (isEditing) {
        unlockDocument()
      }
    }
  }, [isEditing, checkLockStatus, unlockDocument])

  // 开始编辑
  const startEditing = async () => {
    if (readOnly) return
    
    setLoading(true)
    try {
      // 尝试获取编辑锁
      const success = await lockDocument()
      
      if (success) {
        setIsEditing(true)
        
        // 聚焦到编辑器
        setTimeout(() => {
          editorRef.current?.focus()
        }, 100)
      }
    } catch (error) {
      console.error('开始编辑失败:', error)
      toast({
        title: '编辑失败',
        description: '无法获取编辑权限，请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // 取消编辑
  const cancelEditing = async () => {
    setLoading(true)
    try {
      // 释放编辑锁
      await unlockDocument()
      
      setIsEditing(false)
      setIsLocked(false)
      setLockedBy(null)
      setLockTime(null)
      setContent(originalContent)
    } catch (error) {
      console.error('取消编辑失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 保存编辑
  const saveEdit = async () => {
    if (!content.trim()) {
      toast({
        title: '内容不能为空',
        description: '请输入有效的内容',
        variant: 'destructive',
      })
      return
    }
    
    setSaving(true)
    try {
      const response = await fetch(`${payloadUrl}/api/wiki/submit-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          collection,
          documentId,
          fieldName,
          newContent: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: content,
                    },
                  ],
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          },
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.requiresApproval) {
          toast({
            title: '编辑已提交审核',
            description: '您的编辑将在管理员审核后生效',
          })
          
          // 发送编辑提交通知给管理员
          try {
            await fetch('/api/wiki/notifications/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                type: 'edit_submitted',
                title: '新的编辑提交',
                message: `用户 ${currentUser?.name || '未知用户'} 提交了对 ${collection === 'tracks' ? '曲目' : '版本'} 的编辑`,
                relatedCollection: collection,
                relatedDocumentId: documentId,
                relatedField: fieldName,
                actionUrl: `/admin/collections/${collection}/${documentId}`,
                metadata: {
                  action: 'submit_edit',
                  field: fieldName,
                  timestamp: new Date().toISOString()
                }
              }),
            })
          } catch (notificationError) {
            console.warn('发送通知失败:', notificationError)
          }
        } else {
          toast({
            title: '保存成功',
            description: '内容已更新',
          })
          
          setOriginalContent(content)
          onContentChange?.({
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: content,
                    },
                  ],
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          })
          
          // 发送编辑成功通知
          try {
            await fetch('/api/wiki/notifications/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                type: 'edit_approved',
                title: '内容已更新',
                message: `${currentUser?.name || '用户'} 更新了 ${collection === 'tracks' ? '曲目' : '版本'} 的 ${fieldName} 内容`,
                relatedCollection: collection,
                relatedDocumentId: documentId,
                relatedField: fieldName,
                actionUrl: window.location.href,
                metadata: {
                  action: 'edit_approved',
                  field: fieldName,
                  timestamp: new Date().toISOString()
                }
              }),
            })
          } catch (notificationError) {
            console.warn('发送通知失败:', notificationError)
          }
        }
        
        // 释放锁定并退出编辑模式
        await unlockDocument()
        setIsEditing(false)
        setIsLocked(false)
        setLockedBy(null)
        setLockTime(null)
        
        // 刷新历史记录
        fetchEditHistory()
        fetchPendingEdits()
      } else {
        const error = await response.json()
        toast({
          title: '保存失败',
          description: error.message || '保存时发生错误',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('保存编辑失败:', error)
      toast({
        title: '保存失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // 审核编辑
  const approveEdit = async (editId: string, approve: boolean) => {
    try {
      const response = await fetch(`${payloadUrl}/api/wiki/approve-edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          editId,
          approve,
        }),
      })
      
      if (response.ok) {
        toast({
          title: approve ? '编辑已批准' : '编辑已拒绝',
          description: approve ? '编辑内容已应用到文档' : '编辑已被拒绝',
        })
        
        fetchPendingEdits()
        fetchEditHistory()
        
        if (approve) {
          // 刷新页面内容
          window.location.reload()
        }
      } else {
        const error = await response.json()
        toast({
          title: '操作失败',
          description: error.message || '审核操作失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('审核编辑失败:', error)
      toast({
        title: '操作失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      })
    }
  }

  // 回滚到指定版本
  const rollbackToVersion = async () => {
    if (!selectedVersion) return
    
    try {
      const response = await fetch(`${payloadUrl}/api/wiki/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          collection,
          documentId,
          fieldName,
          targetVersionId: selectedVersion.id,
        }),
      })
      
      if (response.ok) {
        toast({
          title: '回滚成功',
          description: `已回滚到版本 ${selectedVersion.edit_version}`,
        })
        
        setShowRollbackDialog(false)
        setSelectedVersion(null)
        fetchEditHistory()
        
        // 刷新页面内容
        window.location.reload()
      } else {
        const error = await response.json()
        toast({
          title: '回滚失败',
          description: error.message || '回滚操作失败',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('回滚失败:', error)
      toast({
        title: '回滚失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      })
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  // 获取用户显示名称
  const getUserDisplayName = (user: any) => {
    if (!user) return '未知用户'
    return user.name || user.email || '匿名用户'
  }

  const hasChanges = content !== originalContent
  const canEdit = !readOnly && !isLocked && currentUser
  const isLockedByOther = isLocked && lockedBy && lockedBy.id !== currentUser?.id

  return (
    <div className="wiki-editor-container space-y-6">
      {/* 编辑器头部 */}
      <div className="relative">
        {/* 简化的标题 - 纯文字，无装饰 */}
        <div className="mb-4">
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">{title}</h3>
          
          {/* 状态指示 */}
          <div className="flex items-center gap-2 mt-1">
            {isLocked && (
              <Badge variant={isLockedByOther ? 'destructive' : 'secondary'} className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                {isLockedByOther 
                  ? `被 ${getUserDisplayName(lockedBy)} 锁定` 
                  : '编辑中'
                }
              </Badge>
            )}
            
            {requiresApproval && (
              <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                <AlertTriangle className="w-3 h-3 mr-1" />
                需要审核
              </Badge>
            )}
          </div>
        </div>
      </div>
        
      {/* 锁定提示 */}
      {isLockedByOther && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-amber-500/20 dark:bg-amber-400/20 border border-amber-200/30 dark:border-amber-700/30 rounded-2xl shadow-xl shadow-amber-500/10 dark:shadow-amber-400/10 p-4"
        >
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
            <div className="flex-shrink-0 w-8 h-8 backdrop-blur-sm bg-amber-100/50 dark:bg-amber-800/50 rounded-full flex items-center justify-center">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium">
                此内容正在被 <strong className="text-amber-900 dark:text-amber-100">{getUserDisplayName(lockedBy)}</strong> 编辑
              </p>
              {lockTime && (
                <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                  编辑开始时间: {formatDate(lockTime)}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
      
      {/* 编辑器内容 */}
      <div className="space-y-6">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative backdrop-blur-xl bg-white/30 dark:bg-slate-900/30 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 p-6"
          >
            <Textarea
              ref={editorRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入内容..."
              className="min-h-[120px] resize-none bg-transparent border-0 focus:ring-0 text-base leading-relaxed placeholder:text-slate-400 dark:placeholder:text-slate-500"
              style={{
                height: 'auto',
                minHeight: '120px',
                maxHeight: '400px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 400) + 'px';
              }}
            />
            
            {/* 状态指示器 */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                hasChanges ? 'bg-amber-400' : 'bg-green-400'
              }`}></div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {hasChanges ? '未保存' : '已保存'}
              </span>
            </div>
            
            {/* 按钮组 - 右下角，仅图标 */}
            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
                disabled={saving || loading}
                className="w-8 h-8 p-0 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70 border border-white/30 dark:border-slate-600/30 rounded-full transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={saveEdit}
                disabled={saving || loading || !hasChanges}
                className="w-8 h-8 p-0 backdrop-blur-sm bg-green-500/80 hover:bg-green-600/80 text-white border border-green-400/30 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Clock className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* 预览模式 */}
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative backdrop-blur-xl bg-blue-500/10 dark:bg-blue-400/10 border border-blue-200/30 dark:border-blue-700/30 rounded-2xl shadow-xl shadow-blue-500/10 dark:shadow-blue-400/10 p-6"
              >
                <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                  {content || (
                    <span className="text-slate-500 dark:text-slate-400 italic">暂无内容</span>
                  )}
                </div>
              </motion.div>
            )}
            
            {/* 只读显示 */}
            <div className="relative backdrop-blur-xl bg-white/30 dark:bg-slate-900/30 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 p-6 min-h-[120px]">
              <div className="prose prose-base max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
                {content || (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-3">
                      <Edit3 className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">暂无内容</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">点击编辑按钮开始添加内容</p>
                  </div>
                )}
              </div>
              
              {/* 功能按钮组 - 右下角，仅图标 */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                {/* 历史记录按钮 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowHistory(true)
                    fetchEditHistory()
                  }}
                  className="w-8 h-8 p-0 backdrop-blur-sm bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70 border border-white/30 dark:border-slate-600/30 rounded-full transition-all duration-200"
                >
                  <History className="w-4 h-4" />
                </Button>
                
                {/* 待审核编辑按钮 */}
                {hasModeratePermission && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPendingEdits(true)
                      fetchPendingEdits()
                    }}
                    className="w-8 h-8 p-0 backdrop-blur-sm bg-amber-500/50 dark:bg-amber-400/50 hover:bg-amber-600/50 dark:hover:bg-amber-500/50 border border-amber-400/30 dark:border-amber-600/30 rounded-full transition-all duration-200"
                  >
                    <Clock className="w-4 h-4" />
                  </Button>
                )}
                
                {/* 预览按钮 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className={`w-8 h-8 p-0 backdrop-blur-sm border rounded-full transition-all duration-200 ${
                    showPreview 
                      ? 'bg-blue-500/50 hover:bg-blue-600/50 border-blue-400/30 text-white'
                      : 'bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70 border-white/30 dark:border-slate-600/30'
                  }`}
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                
                {/* 编辑按钮 */}
                {!isEditing && canEdit && (
                  <Button
                    onClick={startEditing}
                    disabled={loading}
                    className="w-8 h-8 p-0 backdrop-blur-sm bg-blue-500/80 hover:bg-blue-600/80 text-white border border-blue-400/30 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 编辑历史对话框 */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-6 border-b border-slate-200 dark:border-slate-700">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">编辑历史</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              查看 {title} 的所有编辑记录
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {editHistory.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <History className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">暂无编辑历史</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">还没有任何编辑记录</p>
              </div>
            ) : (
              editHistory.map((edit) => (
                <div key={edit.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600">
                        版本 {edit.edit_version}
                      </Badge>
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {edit.operation_type === 'create' && '创建'}
                        {edit.operation_type === 'update' && '更新'}
                        {edit.operation_type === 'rollback' && '回滚'}
                      </span>
                      {edit.approval_status && (
                        <Badge 
                          variant="outline"
                          className={`px-3 py-1 text-xs font-medium ${
                            edit.approval_status === 'approved' 
                              ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-600 dark:text-green-400'
                              : edit.approval_status === 'rejected'
                              ? 'bg-red-50 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-600 dark:text-red-400'
                              : 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:border-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {edit.approval_status === 'approved' && '已批准'}
                          {edit.approval_status === 'rejected' && '已拒绝'}
                          {edit.approval_status === 'pending' && '待审核'}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {hasModeratePermission && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVersion(edit)
                            setShowRollbackDialog(true)
                          }}
                          className="h-8 px-3 text-xs font-medium border-slate-300 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-800 transition-all duration-200"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          回滚
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="font-medium">{getUserDisplayName(edit.editor)}</span>
                    </div>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 dark:text-slate-400">{formatDate(edit.created_at)}</span>
                  </div>
                  
                  {edit.content_diff && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">更改内容:</Label>
                      <pre className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 overflow-x-auto leading-relaxed">
                        {edit.content_diff}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 待审核编辑对话框 */}
      <Dialog open={showPendingEdits} onOpenChange={setShowPendingEdits}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-6 border-b border-slate-200 dark:border-slate-700">
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">待审核编辑</DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              审核 {title} 的待处理编辑
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {pendingEdits.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">暂无待审核编辑</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">所有编辑都已处理完成</p>
              </div>
            ) : (
              pendingEdits.map((edit) => (
                <div key={edit.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="px-3 py-1 text-xs font-medium bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/20 dark:border-amber-600 dark:text-amber-400">
                        待审核
                      </Badge>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => approveEdit(edit.id, false)}
                        className="h-8 px-3 text-xs font-medium border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
                      >
                        <X className="w-3 h-3 mr-1" />
                        拒绝
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => approveEdit(edit.id, true)}
                        className="h-8 px-4 text-xs font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        批准
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                      </div>
                      <span className="font-medium">{getUserDisplayName(edit.editor)}</span>
                    </div>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 dark:text-slate-400">{formatDate(edit.created_at)}</span>
                  </div>
                  
                  {edit.content_diff && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">更改内容:</Label>
                      <pre className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 overflow-x-auto leading-relaxed">
                        {edit.content_diff}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 回滚确认对话框 */}
      <Dialog open={showRollbackDialog} onOpenChange={setShowRollbackDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              确认回滚
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400 leading-relaxed">
              您确定要回滚到版本 <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedVersion?.edit_version}</span> 吗？
              <br />
              这将会覆盖当前内容，并创建一个新的编辑记录。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRollbackDialog(false)
                setSelectedVersion(null)
              }}
              className="h-10 px-4 text-sm font-medium border-slate-300 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-800 transition-all duration-200"
            >
              取消
            </Button>
            <Button 
              onClick={rollbackToVersion}
              className="h-10 px-6 text-sm font-medium bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
            >
              确认回滚
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}