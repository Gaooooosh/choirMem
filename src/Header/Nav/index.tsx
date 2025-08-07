'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/Auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const pathname = usePathname()
  const { user, setUser } = useAuth()

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
        const isActive = pathname === link?.url || 
          (link?.reference && typeof link.reference.value === 'object' && 
           pathname === `/${link.reference.relationTo}/${link.reference.value.slug}`)
        
        return (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <CMSLink 
              {...link} 
              className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-white/20 hover:to-white/10 dark:hover:from-gray-800/20 dark:hover:to-gray-700/10 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-white/20 dark:hover:border-gray-700/30'
              } backdrop-blur-sm`}
            />
          </motion.div>
        )
      })}
      
      {/* 搜索按钮 */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="relative p-2 rounded-xl bg-gradient-to-r from-white/20 to-white/10 dark:from-gray-800/20 dark:to-gray-700/10 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 hover:from-white/30 hover:to-white/20 dark:hover:from-gray-800/30 dark:hover:to-gray-700/20 transition-all duration-300"
        >
          <Link href="/search">
            <SearchIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300" />
            <span className="sr-only">搜索</span>
          </Link>
        </Button>
      </motion.div>

      {/* 用户认证区域 */}
      {user ? (
        /* 已登录用户 - 显示用户头像和下拉菜单 */
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <Button
                variant="ghost"
                className="relative p-1 rounded-xl bg-gradient-to-r from-white/20 to-white/10 dark:from-gray-800/20 dark:to-gray-700/10 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 hover:from-white/30 hover:to-white/20 dark:hover:from-gray-800/30 dark:hover:to-gray-700/20 transition-all duration-300"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.avatar && typeof user.avatar === 'object' && 'url' in user.avatar ? user.avatar.url : undefined} alt={user.username || user.email} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm">
                    {(user.username || user.email)?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border border-white/20 dark:border-gray-700/30">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{user.username || '用户'}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/profile/${user.username || user.id}`} className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                个人资料
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600 dark:text-red-400">
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
          >
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-white/20 to-white/10 dark:from-gray-800/20 dark:to-gray-700/10 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 hover:from-white/30 hover:to-white/20 dark:hover:from-gray-800/30 dark:hover:to-gray-700/20 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Link href="/login">登录</Link>
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Button
              size="sm"
              asChild
              className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href="/register">注册</Link>
            </Button>
          </motion.div>
        </div>
      )}
    </nav>
  )
}
