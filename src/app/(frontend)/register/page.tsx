import React from 'react'
import { Metadata } from 'next'
import { RegisterClient } from './page.client'

export const metadata: Metadata = {
  title: '注册 - 合唱团记忆',
  description: '注册合唱团记忆系统账号',
}

export default function RegisterPage() {
  return <RegisterClient />
}