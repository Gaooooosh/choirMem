"use client"
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Mail } from 'lucide-react'

export default function EmailConfirmClient() {
  const sp = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<'pending'|'success'|'error'>('pending')
  const [message, setMessage] = useState('正在验证，请稍候...')

  useEffect(() => {
    const t = sp.get('t')
    const uid = sp.get('uid')
    if (!t || !uid) {
      setState('error')
      setMessage('缺少验证参数')
      return
    }
    ;(async ()=>{
      try {
        const res = await fetch(`/api/email/confirm?t=${encodeURIComponent(t)}&uid=${encodeURIComponent(uid)}`)
        const data = await res.json().catch(()=>({}))
        if (res.ok) {
          setState('success')
          setMessage('邮箱验证成功，您现在可以登录或继续操作。')
        } else {
          setState('error')
          setMessage(String(data.message || '令牌无效或已过期'))
        }
      } catch {
        setState('error')
        setMessage('网络错误，请稍后重试')
      }
    })()
  }, [sp])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-2 bg-gradient-to-r from-blue-500 to-purple-600">
              {state==='success' ? <CheckCircle className="w-8 h-8 text-white"/> : <Mail className="w-8 h-8 text-white"/>}
            </div>
            <CardTitle className="text-2xl font-bold">
              {state==='success' ? '邮箱已验证' : state==='error' ? '验证失败' : '验证中'}
            </CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-3 pb-6">
            {state==='success' ? (
              <>
                <Button onClick={()=>router.push('/login')}>前往登录</Button>
                <Button variant="outline" onClick={()=>router.push('/')}>返回首页</Button>
              </>
            ) : state==='error' ? (
              <>
                <Button onClick={()=>router.push('/login')}>返回登录并重发验证</Button>
                <Button variant="outline" onClick={()=>router.push('/')}>返回首页</Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

