import React from 'react'
import { Metadata } from 'next'
import { LoginClient } from './page.client'

export const metadata: Metadata = {
  title: '登录 - 合唱团记忆',
  description: '登录到合唱团记忆系统',
}

export default function LoginPage() {
  return <LoginClient />
}