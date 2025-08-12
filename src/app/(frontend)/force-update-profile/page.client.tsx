'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/providers/Auth'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { getClientSideURL } from '@/utilities/getURL'
import type { User } from '@/payload-types'

interface ForceUpdateProfileClientProps {
  user: User
}

export function ForceUpdateProfileClient({ user }: ForceUpdateProfileClientProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // 检查用户是否需要重置密码
  const needsPasswordReset = user.email?.includes('@example.com') || false
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { setUser } = useAuth()
  const router = useRouter()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError('') // 清除错误信息
  }

  const validateForm = () => {
    // 验证姓名
    if (!formData.name || formData.name.trim() === '') {
      setError('请填写真实姓名')
      return false
    }

    // 验证邮箱
    if (!formData.email) {
      setError('请填写邮箱地址')
      return false
    }

    // 验证密码字段
    if (!formData.newPassword) {
      setError('请填写新密码')
      return false
    }

    // 对于不需要重置密码的用户，验证当前密码
    if (!needsPasswordReset && !formData.currentPassword) {
      setError('请填写当前密码')
      return false
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('两次输入的新密码不一致')
      return false
    }

    if (formData.newPassword.length < 6) {
      setError('新密码长度至少为6位')
      return false
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('请输入有效的邮箱地址')
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
      // 对于不需要重置密码的用户，验证当前密码
      if (!needsPasswordReset) {
        const loginResponse = await fetch(`${getClientSideURL()}/api/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email: user.email,
            password: formData.currentPassword,
          }),
        })

        if (!loginResponse.ok) {
          setError('当前密码验证失败')
          setIsLoading(false)
          return
        }
      }

      // 更新用户信息
      const updateResponse = await fetch(`${getClientSideURL()}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.newPassword,
        }),
      })

      const updateData = await updateResponse.json()

      if (updateResponse.ok) {
        setSuccess(true)
        // 更新用户状态
        setUser(updateData.doc)
        // 2秒后跳转到首页
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        setError(updateData.message || '更新失败，请重试')
      }
    } catch (error) {
      console.error('Update error:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Card className="w-full max-w-md mx-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4"
              >
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </motion.div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                信息更新成功！
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                您的邮箱和密码已成功更新，即将跳转到首页...
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-red-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-yellow-400/20 to-orange-600/20 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4"
            >
              <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              完善个人信息
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {needsPasswordReset
                ? '检测到您使用的是临时邮箱和密码，请更新为您的真实信息和安全密码'
                : '请完善您的个人信息'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  当前用户名：<strong>{user.username}</strong>
                  <br />
                  当前邮箱：<strong>{user.email}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="name">真实姓名 *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="请输入您的真实姓名（必填）"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                  className="bg-white/50 dark:bg-gray-800/50 border-white/20 dark:border-gray-700/30 backdrop-blur-sm"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  请填写您的真实姓名，这将用于合唱团的正式记录
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">新邮箱地址</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入您的真实邮箱"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="bg-white/50 dark:bg-gray-800/50 border-white/20 dark:border-gray-700/30 backdrop-blur-sm"
                />
              </div>

              {!needsPasswordReset && (
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">当前密码</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="请输入当前密码"
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      required
                      className="bg-white/50 dark:bg-gray-800/50 border-white/20 dark:border-gray-700/30 backdrop-blur-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {needsPasswordReset && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    由于您使用的是临时密码，无需输入当前密码即可直接设置新密码
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">新密码</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="请输入新密码（至少6位）"
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    required
                    className="bg-white/50 dark:bg-gray-800/50 border-white/20 dark:border-gray-700/30 backdrop-blur-sm pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认新密码</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="请再次输入新密码"
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

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    更新中...
                  </>
                ) : (
                  '更新信息'
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
