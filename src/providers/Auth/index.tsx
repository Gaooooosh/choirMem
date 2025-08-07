'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

import type { User as PayloadUser } from '@/payload-types'

type User = PayloadUser

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // 检查是否存在认证信息
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/users/me`, {
          credentials: 'include',
        })
        
        if (response.ok) {
          const userData = await response.json()
          // 确保userData.user存在再设置用户状态
          if (userData && userData.user) {
            setUser(userData.user)
          } else {
            // 如果没有用户数据，确保user状态为null
            setUser(null)
          }
        } else {
          // 如果响应不成功，确保user状态为null
          setUser(null)
        }
      } catch (error) {
        console.error('Error checking auth status:', error)
        // 发生错误时确保user状态为null
        setUser(null)
      }
    }

    checkAuth()
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}