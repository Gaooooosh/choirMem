'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '../../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Eye, EyeOff, User, Lock, FileText } from 'lucide-react'
import type { User as UserType } from '../../../payload-types'

interface ProfileClientProps {
  user: UserType
}

interface FormData {
  name: string
  bio: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface Message {
  type: 'success' | 'error'
  text: string
}

export function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailMessage, setEmailMessage] = useState<string | null>(null)

  // 检查用户是否需要重置密码
  const needsPasswordReset = user.needs_password_reset === true
  const needEmailVerify = user.email_verified === false

  const [formData, setFormData] = useState<FormData>({
    name: user.name || '',
    bio: typeof user.bio === 'string' ? user.bio : '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    // 验证姓名是否填写
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: '请填写您的真实姓名' })
      setIsLoading(false)
      return
    }

    try {
      const csrfRes = await fetch('/api/csrf', { credentials: 'include', cache: 'no-store' })
      if (!csrfRes.ok) throw new Error(`获取CSRF失败: ${csrfRes.status}`)
      const cct = csrfRes.headers.get('content-type') || ''
      const { token: csrfToken } = cct.includes('application/json')
        ? await csrfRes.json()
        : { token: await csrfRes.text() }
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: '个人信息更新成功！' })
        // 刷新页面以获取最新数据
        router.refresh()
      } else {
        setMessage({ type: 'error', text: data.error || '更新失败，请重试' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请重试' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    // 客户端验证
    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: '新密码至少需要6位字符' })
      setIsLoading(false)
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: '两次输入的新密码不一致' })
      setIsLoading(false)
      return
    }

    // 对于需要重置密码的用户，不需要验证当前密码
    if (!needsPasswordReset) {
      if (!formData.currentPassword) {
        setMessage({ type: 'error', text: '请输入当前密码' })
        setIsLoading(false)
        return
      }
      if (formData.newPassword === formData.currentPassword) {
        setMessage({ type: 'error', text: '新密码不能与当前密码相同' })
        setIsLoading(false)
        return
      }
    }

    try {
      const requestBody: any = {
        newPassword: formData.newPassword,
      }

      // 只有非临时密码用户才需要提供当前密码
      if (!needsPasswordReset) {
        requestBody.currentPassword = formData.currentPassword
      }

      const csrfRes = await fetch('/api/csrf', { credentials: 'include', cache: 'no-store' })
      if (!csrfRes.ok) throw new Error(`获取CSRF失败: ${csrfRes.status}`)
      const cct2 = csrfRes.headers.get('content-type') || ''
      const { token: csrfToken } = cct2.includes('application/json')
        ? await csrfRes.json()
        : { token: await csrfRes.text() }
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: '密码修改成功！' })
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }))
        // 如果是临时密码用户，刷新页面
        if (needsPasswordReset) {
          setTimeout(() => {
            router.refresh()
          }, 1500)
        }
      } else {
        setMessage({ type: 'error', text: data.error || '密码修改失败，请重试' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请重试' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">个人资料</h1>
        <p className="text-muted-foreground mt-2">管理您的个人信息和账户设置</p>
      </div>

      {needEmailVerify && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-800">
            您的邮箱尚未验证，请前往邮箱点击验证链接完成验证。
            <button
              className="ml-3 underline text-blue-600"
              type="button"
              onClick={async () => {
                try {
                  setEmailMessage(null)
                  const csrfRes = await fetch('/api/csrf', { credentials: 'include', cache: 'no-store' })
                  const cct = csrfRes.headers.get('content-type') || ''
                  const { token: csrfToken } = cct.includes('application/json')
                    ? await csrfRes.json()
                    : { token: await csrfRes.text() }
                  const r = await fetch('/api/email/resend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                    body: JSON.stringify({ uid: String(user.id) }),
                  })
                  const msg = await r.json().catch(() => ({ message: '已尝试重新发送' }))
                  setEmailMessage(String(msg.message || '验证邮件已发送，请查收'))
                } catch {
                  setEmailMessage('网络错误，请稍后再试')
                }
              }}
            >
              重新发送验证邮件
            </button>
            {emailMessage && <span className="ml-2">{emailMessage}</span>}
          </AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert
          className={`mb-6 ${
            message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
          }`}
        >
          <AlertDescription
            className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* 个人信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              个人信息
            </CardTitle>
            <CardDescription>更新您的基本信息</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  真实姓名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="请输入您的真实姓名（必填）"
                  disabled={isLoading}
                  required
                />
                <p className="text-sm text-muted-foreground">请填写您的真实姓名，用于身份识别</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  value={user.username}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">用户名无法修改</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
                <p className="text-sm text-muted-foreground">邮箱无法修改</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">个人简介</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="介绍一下自己吧..."
                  disabled={isLoading}
                  rows={4}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? '保存中...' : '保存信息'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 密码修改卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {needsPasswordReset ? '设置密码' : '修改密码'}
            </CardTitle>
            <CardDescription>
              {needsPasswordReset
                ? '请设置一个新密码来完善您的账户信息，无需输入当前密码'
                : '为了您的账户安全，请定期更换密码'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {!needsPasswordReset && (
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">当前密码</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      placeholder="请输入当前密码"
                      disabled={isLoading}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={isLoading}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">{needsPasswordReset ? '新密码' : '新密码'}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="请输入新密码（至少6位）"
                    disabled={isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isLoading}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="请再次输入新密码"
                    disabled={isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading
                  ? needsPasswordReset
                    ? '设置中...'
                    : '修改中...'
                  : needsPasswordReset
                    ? '设置密码'
                    : '修改密码'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* 快捷链接 */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              快捷操作
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Link href="/profile/avatar">
                <Button variant="outline" className="w-full">
                  修改头像
                </Button>
              </Link>
              <Link href="/profile/password">
                <Button variant="outline" className="w-full">
                  单独修改密码
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
