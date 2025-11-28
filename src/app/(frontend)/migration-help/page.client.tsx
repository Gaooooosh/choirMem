'use client'

import React, { useState } from 'react'
import type { User } from '@/payload-types'
import { useRouter } from 'next/navigation'
import { getClientSideURL } from '@/utilities/getURL'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, Info } from 'lucide-react'

export default function MigrationHelpClient({ user }: { user: User }) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码长度至少为6位' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' })
      return
    }

    try {
      setIsLoading(true)
      const csrfRes = await fetch('/api/csrf', { credentials: 'include', cache: 'no-store' })
      if (!csrfRes.ok) throw new Error(`获取CSRF失败: ${csrfRes.status}`)
      const cct = csrfRes.headers.get('content-type') || ''
      const { token: csrfToken } = cct.includes('application/json')
        ? await csrfRes.json()
        : { token: await csrfRes.text() }
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        credentials: 'include',
        body: JSON.stringify({ newPassword }),
      })
      const ctt = res.headers.get('content-type') || ''
      const data = ctt.includes('application/json') ? await res.json() : { error: await res.text() }
      if (res.ok) {
        setMessage({ type: 'success', text: '密码设置成功，正在跳转...' })
        setTimeout(() => router.push('/'), 1200)
      } else {
        setMessage({ type: 'error', text: data.error || '密码设置失败，请重试' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailMsg(null)
    const emailOk = /^(?:[a-zA-Z0-9_\-.+])+@(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}$/.test(newEmail)
    if (!emailOk) { setEmailMsg('邮箱格式不正确'); return }
    try {
      const csrfRes = await fetch('/api/csrf', { credentials: 'include', cache: 'no-store' })
      const cct = csrfRes.headers.get('content-type') || ''
      const { token: csrfToken } = cct.includes('application/json') ? await csrfRes.json() : { token: await csrfRes.text() }
      const r = await fetch('/api/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        credentials: 'include',
        body: JSON.stringify({ email: newEmail }),
      })
      const data = await r.json().catch(() => ({ message: '' }))
      if (r.ok) setEmailMsg('已发送验证邮件，请前往新邮箱完成验证')
      else setEmailMsg(String(data.error || '设置失败，请稍后重试'))
    } catch {
      setEmailMsg('网络错误，请稍后重试')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" /> 迁移帮助
            </CardTitle>
            <CardDescription>
              您好，{user.name || user.username}。请设置一个新密码完成迁移。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Alert>
                <AlertDescription>
                  您当前使用的是迁移临时密码，设置新密码后即可正常使用所有功能。
                </AlertDescription>
              </Alert>
            </div>

            <div className="mb-6">
              <form onSubmit={handleEmailSubmit} className="space-y-2">
                <Label htmlFor="newEmail">新的邮箱</Label>
                <Input id="newEmail" type="email" value={newEmail} onChange={(e)=>setNewEmail(e.target.value)} placeholder="请输入新的邮箱以绑定账户" />
                <div className="flex gap-2">
                  <Button type="submit" variant="outline">发送验证到新邮箱</Button>
                  <Button type="button" variant="ghost" onClick={async ()=>{
                    try {
                      const csrfRes = await fetch('/api/csrf', { credentials: 'include', cache: 'no-store' })
                      const cct = csrfRes.headers.get('content-type') || ''
                      const { token: csrfToken } = cct.includes('application/json') ? await csrfRes.json() : { token: await csrfRes.text() }
                      const r = await fetch('/api/email/resend', {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken }, credentials: 'include', body: JSON.stringify({ uid: String(user.id) })
                      })
                      const msg = await r.json().catch(()=>({ message:'已尝试重新发送' }))
                      setEmailMsg(String(msg.message || '验证邮件已发送'))
                    } catch { setEmailMsg('网络错误，请稍后再试') }
                  }}>重新发送</Button>
                </div>
                {emailMsg && <div className="text-sm text-muted-foreground">{emailMsg}</div>}
              </form>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">新密码</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="至少6位"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 设置中...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" /> 设置密码
                  </>
                )}
              </Button>
            </form>
            {message && (
              <div
                className={`mt-4 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}
              >
                {message.text}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
