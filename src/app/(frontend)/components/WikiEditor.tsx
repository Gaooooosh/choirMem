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
    <div className="space-y-4">
      {/* 编辑器头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          
          {/* 锁定状态指示 */}
          {isLocked && (
            <Badge variant={isLockedByOther ? 'destructive' : 'secondary'}>
              <Lock className="w-3 h-3 mr-1" />
              {isLockedByOther 
                ? `被 ${getUserDisplayName(lockedBy)} 锁定` 
                : '编辑中'
              }
            </Badge>
          )}
          
          {/* 需要审核标识 */}
          {requiresApproval && (
            <Badge variant="outline">
              <AlertTriangle className="w-3 h-3 mr-1" />
              需要审核
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* 历史记录按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowHistory(true)
              fetchEditHistory()
            }}
          >
            <History className="w-4 h-4 mr-1" />
            历史
          </Button>
          
          {/* 待审核编辑按钮 */}
          {hasModeratePermission && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPendingEdits(true)
                fetchPendingEdits()
              }}
            >
              <Clock className="w-4 h-4 mr-1" />
              待审核 ({pendingEdits.length})
            </Button>
          )}
          
          {/* 预览按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {showPreview ? '隐藏预览' : '预览'}
          </Button>
          
          {/* 编辑按钮 */}
          {!isEditing && canEdit && (
            <Button
              onClick={startEditing}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              编辑
            </Button>
          )}
        </div>
      </div>
      
      {/* 锁定提示 */}
      {isLockedByOther && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center gap-2 text-yellow-800">
            <Lock className="w-4 h-4" />
            <span>
              此内容正在被 <strong>{getUserDisplayName(lockedBy)}</strong> 编辑
              {lockTime && (
                <span className="text-sm text-yellow-600 ml-2">
                  (开始于 {formatDate(lockTime)})
                </span>
              )}
            </span>
          </div>
        </motion.div>
      )}
      
      {/* 编辑器内容 */}
      <div className="space-y-4">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Textarea
              ref={editorRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入内容..."
              className="min-h-[300px] resize-none"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {hasChanges ? '有未保存的更改' : '无更改'}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                  disabled={saving || loading}
                >
                  <X className="w-4 h-4 mr-1" />
                  取消
                </Button>
                
                <Button
                  onClick={saveEdit}
                  disabled={saving || loading || !hasChanges}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 mr-1"
                    >
                      <Clock className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  保存
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* 预览模式 */}
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-gray-50 border rounded-lg"
              >
                <h4 className="text-sm font-medium mb-2">预览</h4>
                <div className="prose prose-sm max-w-none">
                  {content || '暂无内容'}
                </div>
              </motion.div>
            )}
            
            {/* 只读显示 */}
            <div className="p-4 bg-white border rounded-lg min-h-[200px]">
              <div className="prose prose-sm max-w-none">
                {content || '暂无内容'}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 编辑历史对话框 */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑历史</DialogTitle>
            <DialogDescription>
              查看 {title} 的所有编辑记录
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {editHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无编辑历史
              </div>
            ) : (
              editHistory.map((edit) => (
                <div key={edit.id} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        版本 {edit.edit_version}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {edit.operation_type === 'create' && '创建'}
                        {edit.operation_type === 'update' && '更新'}
                        {edit.operation_type === 'rollback' && '回滚'}
                      </span>
                      {edit.approval_status && (
                        <Badge 
                          variant={
                            edit.approval_status === 'approved' ? 'default' :
                            edit.approval_status === 'rejected' ? 'destructive' : 'secondary'
                          }
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
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          回滚
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>{getUserDisplayName(edit.editor)}</span>
                    <span>•</span>
                    <span>{formatDate(edit.created_at)}</span>
                  </div>
                  
                  {edit.content_diff && (
                    <div className="text-sm">
                      <Label>更改内容:</Label>
                      <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>待审核编辑</DialogTitle>
            <DialogDescription>
              审核 {title} 的待处理编辑
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {pendingEdits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无待审核编辑
              </div>
            ) : (
              pendingEdits.map((edit) => (
                <div key={edit.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        待审核
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => approveEdit(edit.id, false)}
                      >
                        <X className="w-3 h-3 mr-1" />
                        拒绝
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => approveEdit(edit.id, true)}
                        className="bg-gradient-to-r from-green-600 to-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        批准
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>{getUserDisplayName(edit.editor)}</span>
                    <span>•</span>
                    <span>{formatDate(edit.created_at)}</span>
                  </div>
                  
                  {edit.content_diff && (
                    <div className="text-sm">
                      <Label>更改内容:</Label>
                      <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认回滚</DialogTitle>
            <DialogDescription>
              您确定要回滚到版本 {selectedVersion?.edit_version} 吗？
              这将会覆盖当前内容，并创建一个新的编辑记录。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRollbackDialog(false)
                setSelectedVersion(null)
              }}
            >
              取消
            </Button>
            <Button onClick={rollbackToVersion}>
              确认回滚
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}