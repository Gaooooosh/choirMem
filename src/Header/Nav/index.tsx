'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { Sun, Moon, User, LogOut, Settings, MessageCircle, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/Auth'
import { useTheme } from '@/providers/Theme'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LatestActivitySidebar } from '@/components/LatestActivitySidebar'
import { NotificationCenter } from '@/app/(frontend)/components/NotificationCenter'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const pathname = usePathname()
  const { user, setUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isActivitySidebarOpen, setIsActivitySidebarOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])



  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="flex items-center space-x-1">
      {navItems.map(({ link }, i) => {
        const isActive =
          pathname === link?.url ||
          (link?.reference &&
            typeof link.reference.value === 'object' &&
            pathname === `/${link.reference.relationTo}/${link.reference.value.slug}`)

        return (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            suppressHydrationWarning
          >
            <CMSLink
                {...link}
                className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 backdrop-blur-2xl backdrop-saturate-125 backdrop-contrast-125 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-300 border border-blue-400/60 shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.1)]'
                    : 'text-white/90 hover:bg-white/8 hover:text-blue-300 border border-transparent hover:border-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]'
                }`}
              />
          </motion.div>
        )
      })}

      {/* 最新动态按钮 */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        suppressHydrationWarning
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsActivitySidebarOpen(true)}
          className="relative p-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/30 hover:bg-white/15 hover:border-white/40 transition-all duration-300"
          style={{
            backdropFilter: 'blur(20px) saturate(1.3) contrast(1.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
        >
          <MessageCircle className="w-5 h-5 text-white/70 hover:text-blue-300 transition-colors duration-300" />
          <span className="sr-only">最新动态</span>
        </Button>
      </motion.div>

      {/* 主题切换按钮 */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        suppressHydrationWarning
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="relative p-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/30 hover:bg-white/15 hover:border-white/40 transition-all duration-300"
          style={{
            backdropFilter: 'blur(20px) saturate(1.3) contrast(1.2)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
        >
          {!mounted ? (
            <Sun className="w-5 h-5 text-white/70 hover:text-yellow-300 transition-colors duration-300" />
          ) : theme === 'dark' ? (
            <Sun className="w-5 h-5 text-white/70 hover:text-yellow-300 transition-colors duration-300" />
          ) : (
            <Moon className="w-5 h-5 text-white/70 hover:text-blue-300 transition-colors duration-300" />
          )}
          <span className="sr-only">{!mounted ? '切换主题' : theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}</span>
        </Button>
      </motion.div>

      {/* 通知中心 */}
      {user && (
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          suppressHydrationWarning
        >
          <NotificationCenter />
        </motion.div>
      )}

      {/* 用户认证区域 */}
      {user ? (
        /* 已登录用户 - 显示用户头像和下拉菜单 */
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              suppressHydrationWarning
            >
              <Button
                variant="ghost"
                className="relative p-1 rounded-xl bg-white/5 backdrop-blur-md border border-white/30 hover:bg-white/15 hover:border-white/40 transition-all duration-300"
                style={{
                  backdropFilter: 'blur(20px) saturate(1.3) contrast(1.2)',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                }}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage
                    src={
                      user.avatar && typeof user.avatar === 'object' && 'url' in user.avatar
                        ? user.avatar.url || undefined
                        : undefined
                    }
                    alt={user.username || user.email}
                  />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                    {(user.username || user.email)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 backdrop-blur-2xl bg-black/85 border border-white/30 text-white"
            style={{
              backdropFilter: 'blur(32px) saturate(1.5) contrast(1.25)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-white">{user.username || '用户'}</p>
              <p className="text-xs text-white/70">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/users/${user.id}`} className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                个人资料
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/statistics" className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                编辑统计
              </Link>
            </DropdownMenuItem>
            {user.is_admin && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    管理后台
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center text-red-400 hover:text-red-300"
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        /* 未登录用户 - 显示登录和注册按钮 */
        <div className="flex items-center space-x-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            suppressHydrationWarning
          >
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="relative px-4 py-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/30 hover:bg-white/15 hover:border-white/40 transition-all duration-300 text-white/90 hover:text-blue-300"
              style={{
                backdropFilter: 'blur(20px) saturate(1.3) contrast(1.2)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              }}
            >
              <Link href="/login">登录</Link>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            suppressHydrationWarning
          >
            <Button
              size="sm"
              asChild
              className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-md border border-blue-400/60 hover:from-blue-500/30 hover:to-purple-600/30 transition-all duration-300 text-blue-300 hover:text-blue-200"
              style={{
                backdropFilter: 'blur(20px) saturate(1.4) contrast(1.3)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.05)'
              }}
            >
              <Link href="/register">注册</Link>
            </Button>
          </motion.div>
        </div>
      )}
      
      {/* 最新动态侧边栏 */}
      <LatestActivitySidebar 
        isOpen={isActivitySidebarOpen} 
        onClose={() => setIsActivitySidebarOpen(false)} 
      />
    </nav>
  )
}
