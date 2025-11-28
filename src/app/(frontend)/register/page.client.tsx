'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Music, Loader2, CheckCircle } from 'lucide-react'
import { getClientSideURL } from '@/utilities/getURL'

export function RegisterClient() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    invitationCode: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const { setUser } = useAuth()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('') // 清除错误信息
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.username || !formData.invitationCode) {
      setError('请填写所有必需字段')
      return false
    }
    
    const emailOk = /^(?:[a-zA-Z0-9_\-.+])+@(?:[a-zA-Z0-9\-]+\.)+[a-zA-Z]{2,}$/.test(formData.email)
    if (!emailOk) {
      setError('邮箱格式不正确')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('密码长度至少为6位')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`${getClientSideURL()}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          invitationCode: formData.invitationCode
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        let msg = String(data.error || data.message || '')
        if (response.status === 400) {
          if (msg.includes('缺少必需字段')) msg = '请填写邮箱、密码、用户名和邀请码'
          else if (msg.includes('无效的邀请码')) msg = '邀请码无效，请联系管理员获取有效邀请码'
          else if (msg.includes('邀请码已用完')) msg = '邀请码已用完，请联系管理员更换邀请码'
          else if (msg.includes('邮箱已存在')) msg = '该邮箱已注册，请尝试登录或找回密码'
          else if (msg.includes('用户名已存在')) msg = '该用户名已被使用，请更换后重试'
          else if (msg.includes('邮箱或用户名已存在')) msg = '邮箱或用户名已存在，请更换后重试'
          else msg = msg || '输入信息无效，请检查后重试'
        } else if (response.status === 500) {
          msg = '服务器错误，请稍后重试'
        } else {
          msg = msg || '网络或系统错误，请稍后重试'
        }
        setError(msg)
      }
    } catch (error) {
      console.error('Register error:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/30 shadow-2xl p-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4"
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">注册提交成功</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">我们已向 {formData.email} 发送验证邮件，请完成邮箱验证后再登录。</p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="default"
                onClick={async () => {
                  try {
                    const csrfRes = await fetch('/api/csrf', { credentials: 'include', cache: 'no-store' })
                    const cct = csrfRes.headers.get('content-type') || ''
                    const { token: csrfToken } = cct.includes('application/json') ? await csrfRes.json() : { token: await csrfRes.text() }
                    const r = await fetch('/api/email/resend', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
                      body: JSON.stringify({ email: formData.email }),
                    })
                    await r.json().catch(() => ({}))
                  } catch {}
                }}
              >
                重新发送验证邮件
              </Button>
              <Button variant="outline" onClick={() => router.push('/login')}>前往登录</Button>
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border border-white/20 dark:border-gray-700/30 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
            >
              <Music className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                加入我们
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                创建您的合唱团记忆账号
              </CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  required
                  className="bg-white/50 dark:bg-gray-800/50 border-white/20 dark:border-gray-700/30 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="bg-white/50 dark:bg-gray-800/50 border-white/20 dark:border-gray-700/30 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码（至少6位）"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="bg-white/50 dark:bg-gray-800/50 border-white/20 dark:border-gray-700/30 backdrop-blur-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="请再次输入密码"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    className="bg-white/50 dark:bg-gray-800/50 border-white/20 dark:border-gray-700/30 backdrop-blur-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invitationCode">邀请码</Label>
                <Input
                  id="invitationCode"
                  type="text"
                  placeholder="请输入邀请码"
                  value={formData.invitationCode}
                  onChange={(e) => handleInputChange('invitationCode', e.target.value)}
                  required
                  className="bg-white/50 dark:bg-gray-800/50 border-white/20 dark:border-gray-700/30 backdrop-blur-sm"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    注册中...
                  </>
                ) : (
                  '注册'
                )}
              </Button>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                已有账号？{' '}
                <Link
                  href="/login"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  立即登录
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
