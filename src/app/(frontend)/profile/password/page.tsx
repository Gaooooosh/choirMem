import { Metadata } from 'next'
import { ChangePasswordClient } from './page.client'

export const metadata: Metadata = {
  title: '修改密码 - 合唱团管理系统',
  description: '修改您的登录密码',
}

export default function ChangePasswordPage() {
  return <ChangePasswordClient />
}