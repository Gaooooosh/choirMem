'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  User,
  Music,
  FileText,
  Calendar,
  Award,
  MapPin,
  Star,
  Heart,
  Eye,
  Settings,
  Lock,
  Camera,
} from 'lucide-react'
import Link from 'next/link'
import { formatDateTime } from '@/utilities/formatDateTime'
import { useTheme } from '@/providers/Theme'
import { useAuth } from '@/providers/Auth'
import type { User as UserType, Article, TrackVersion, Media } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { DefaultAvatar } from '@/components/DefaultAvatar'

interface UserProfileClientProps {
  user: UserType
  articles: Article[]
  tracks: TrackVersion[]
  articlesTotal: number
  tracksTotal: number
}

export const UserProfileClient: React.FC<UserProfileClientProps> = ({
  user,
  articles,
  tracks,
  articlesTotal,
  tracksTotal,
}) => {
  const { theme } = useTheme()
  const { user: currentUser } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'tracks'>('articles')
  const currentTheme = theme || 'light'
  const isOwnProfile = currentUser?.id === user.id

  useEffect(() => {
    setMounted(true)
  }, [])

  const avatarUrl =
    user.avatar && typeof user.avatar === 'object' ? getMediaUrl((user.avatar as Media).url) : null

  const getUserInitials = (user: UserType) => {
    if (user.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    }
    return user.username?.charAt(0).toUpperCase() || 'U'
  }

  const renderBioContent = (bio: any) => {
    if (typeof bio === 'string') {
      return (
        <p className={`${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{bio}</p>
      )
    }

    if (bio && Array.isArray(bio)) {
      return bio.map((block: any, index: number) => (
        <p
          key={index}
          className={`mb-2 last:mb-0 ${
            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          {block.children?.map((child: any) => child.text).join('') || ''}
        </p>
      ))
    }

    return null
  }

  return (
    <div className="min-h-screen relative overflow-hidden pt-20">
      {/* 背景层 */}
      <div className="absolute inset-0 -z-10">
        {/* 用户头像毛玻璃背景 */}
        {avatarUrl && (
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${avatarUrl})`,
                filter: 'blur(8px) brightness(0.6)',
                transform: 'scale(1.05)',
              }}
            />
            <div
              className={`absolute inset-0 ${
                currentTheme === 'dark' ? 'bg-black/60' : 'bg-white/40'
              }`}
            />
          </div>
        )}

        {/* 默认渐变背景（当没有头像时） */}
        {!avatarUrl && (
          <div
            className={`absolute inset-0 transition-all duration-800 ${
              currentTheme === 'dark'
                ? 'bg-gradient-to-br from-slate-800 via-blue-900/20 to-purple-900/20'
                : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
            }`}
          />
        )}
      </div>

      {/* 动态弥散光晕层 */}
      {mounted && (
        <>
          {Array.from({ length: 4 }).map((_, i) => {
            const colors = [
              'from-blue-500/20 to-cyan-500/20',
              'from-purple-500/20 to-pink-500/20',
              'from-green-500/20 to-emerald-500/20',
              'from-orange-500/20 to-red-500/20',
            ]
            return (
              <motion.div
                key={i}
                className={`absolute w-96 h-96 rounded-full bg-gradient-to-r ${colors[i]} blur-3xl opacity-30`}
                animate={{
                  x: [0, 100, -50, 0],
                  y: [0, -100, 50, 0],
                  scale: [1, 1.2, 0.8, 1],
                }}
                transition={{
                  duration: 20 + i * 5,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{
                  left: `${20 + i * 20}%`,
                  top: `${10 + i * 15}%`,
                }}
              />
            )
          })}
        </>
      )}

      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* 用户头部信息 - 重新设计突出头像 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-12"
        >
          <div
            className={`relative rounded-3xl overflow-hidden backdrop-blur-xl border shadow-2xl ${
              currentTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/20 border-white/30'
            }`}
          >
            {/* 内部光晕效果 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10" />

            <div className="relative p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
                {/* 大头像区域 */}
                <motion.div
                  className="relative flex-shrink-0"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="relative">
                    {/* 头像光环效果 */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-xl animate-pulse" />

                    {avatarUrl ? (
                      <Avatar className="w-48 h-48 lg:w-56 lg:h-56 border-4 border-white/30 shadow-2xl relative z-10">
                        <AvatarImage
                          src={avatarUrl}
                          alt={user.name || user.username}
                          className="object-cover"
                        />
                        <AvatarFallback
                          className={`text-6xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white`}
                        >
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <DefaultAvatar
                        type={user.default_avatar || 'music-note'}
                        size="xl"
                        className="w-48 h-48 lg:w-56 lg:h-56 border-4 border-white/30 shadow-2xl relative z-10"
                      />
                    )}

                    {/* 管理员徽章 */}
                    {user.is_admin && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                        className="absolute -bottom-2 -right-2 z-20"
                      >
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 px-3 py-1 text-sm font-semibold shadow-lg">
                          <Award className="w-4 h-4 mr-1" />
                          管理员
                        </Badge>
                      </motion.div>
                    )}

                    {/* 设置按钮组 - 只有查看自己的个人资料时才显示 */}
                    {isOwnProfile && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7, type: 'spring' }}
                        className="absolute -top-2 -left-2 z-20 flex gap-2"
                      >
                        {/* 头像设置按钮 */}
                        <Link href="/profile/avatar">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 px-3 py-2 shadow-lg rounded-full"
                            title="设置头像"
                          >
                            <Camera className="w-4 h-4" />
                          </Button>
                        </Link>
                        
                        {/* 修改密码按钮 */}
                        <Link href="/profile/password">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white border-0 px-3 py-2 shadow-lg rounded-full"
                            title="修改密码"
                          >
                            <Lock className="w-4 h-4" />
                          </Button>
                        </Link>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* 用户信息区域 */}
                <div className="flex-1 text-center lg:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="mb-6"
                  >
                    <h1
                      className={`text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent`}
                    >
                      {user.name || user.username}
                    </h1>
                    {user.name && (
                      <p
                        className={`text-xl ${
                          currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        @{user.username}
                      </p>
                    )}
                  </motion.div>

                  {/* 统计卡片 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
                  >
                    <div
                      className={`p-4 rounded-2xl backdrop-blur-sm border ${
                        currentTheme === 'dark'
                          ? 'bg-white/5 border-white/10'
                          : 'bg-white/30 border-white/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span
                          className={`text-2xl font-bold ${
                            currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                          }`}
                        >
                          {articlesTotal}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        篇文章
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-2xl backdrop-blur-sm border ${
                        currentTheme === 'dark'
                          ? 'bg-white/5 border-white/10'
                          : 'bg-white/30 border-white/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Music className="w-5 h-5 text-purple-500" />
                        <span
                          className={`text-2xl font-bold ${
                            currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                          }`}
                        >
                          {tracksTotal}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        个曲谱
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-2xl backdrop-blur-sm border ${
                        currentTheme === 'dark'
                          ? 'bg-white/5 border-white/10'
                          : 'bg-white/30 border-white/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span
                          className={`text-2xl font-bold ${
                            currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                          }`}
                        >
                          {user.activity_score || 0}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        活跃度
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-2xl backdrop-blur-sm border ${
                        currentTheme === 'dark'
                          ? 'bg-white/5 border-white/10'
                          : 'bg-white/30 border-white/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-5 h-5 text-green-500" />
                        <span
                          className={`text-lg font-bold ${
                            currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                          }`}
                        >
                          {new Date(user.createdAt).getFullYear()}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        加入年份
                      </p>
                    </div>
                  </motion.div>

                  {/* 个人简介 */}
                  {user.bio && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                      className={`p-6 rounded-2xl backdrop-blur-sm border max-w-2xl mx-auto lg:mx-0 ${
                        currentTheme === 'dark'
                          ? 'bg-white/5 border-white/10'
                          : 'bg-white/30 border-white/40'
                      }`}
                    >
                      <div className="prose prose-lg max-w-none">{renderBioContent(user.bio)}</div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 内容标签页 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        >
          <div
            className={`relative rounded-3xl overflow-hidden backdrop-blur-xl border shadow-2xl ${
              currentTheme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white/20 border-white/30'
            }`}
          >
            {/* 内部光晕效果 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-pink-500/5" />

            <div className="relative">
              {/* 标签页导航 */}
              <div
                className={`border-b ${
                  currentTheme === 'dark' ? 'border-white/10' : 'border-white/20'
                }`}
              >
                <nav className="flex space-x-1 px-6 pt-6">
                  <motion.button
                    onClick={() => setActiveTab('overview')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative pb-4 px-4 font-medium text-sm transition-all duration-300 rounded-t-2xl ${
                      activeTab === 'overview'
                        ? currentTheme === 'dark'
                          ? 'text-white bg-white/10'
                          : 'text-gray-800 bg-white/30'
                        : currentTheme === 'dark'
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      概览
                    </div>
                    {activeTab === 'overview' && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => setActiveTab('articles')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative pb-4 px-4 font-medium text-sm transition-all duration-300 rounded-t-2xl ${
                      activeTab === 'articles'
                        ? currentTheme === 'dark'
                          ? 'text-white bg-white/10'
                          : 'text-gray-800 bg-white/30'
                        : currentTheme === 'dark'
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      文章
                      <Badge
                        variant="secondary"
                        className={`ml-2 ${
                          activeTab === 'articles'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0'
                            : currentTheme === 'dark'
                              ? 'bg-white/10 text-gray-300 border-white/20'
                              : 'bg-white/40 text-gray-700 border-white/30'
                        }`}
                      >
                        {articlesTotal}
                      </Badge>
                    </div>
                    {activeTab === 'articles' && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                  <motion.button
                    onClick={() => setActiveTab('tracks')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative pb-4 px-4 font-medium text-sm transition-all duration-300 rounded-t-2xl ${
                      activeTab === 'tracks'
                        ? currentTheme === 'dark'
                          ? 'text-white bg-white/10'
                          : 'text-gray-800 bg-white/30'
                        : currentTheme === 'dark'
                          ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                          : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      曲谱
                      <Badge
                        variant="secondary"
                        className={`ml-2 ${
                          activeTab === 'tracks'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0'
                            : currentTheme === 'dark'
                              ? 'bg-white/10 text-gray-300 border-white/20'
                              : 'bg-white/40 text-gray-700 border-white/30'
                        }`}
                      >
                        {tracksTotal}
                      </Badge>
                    </div>
                    {activeTab === 'tracks' && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                </nav>
              </div>

              {/* 标签页内容 */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 最新文章 */}
                        <div
                          className={`p-6 rounded-2xl backdrop-blur-sm border ${
                            currentTheme === 'dark'
                              ? 'bg-white/5 border-white/10'
                              : 'bg-white/30 border-white/40'
                          }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
                          <div className="relative p-6">
                            <h3
                              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                                currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                              }`}
                            >
                              <FileText className="w-5 h-5 text-blue-500" />
                              最新文章
                            </h3>
                            {articles.length > 0 ? (
                              <div className="space-y-3">
                                {articles.slice(0, 3).map((article) => (
                                  <Link
                                    key={article.id}
                                    href={`/articles/${article.id}`}
                                    className={`block p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
                                      currentTheme === 'dark'
                                        ? 'border-white/10 hover:bg-white/10'
                                        : 'border-white/40 hover:bg-white/50'
                                    }`}
                                  >
                                    <h4
                                      className={`font-medium mb-1 ${
                                        currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                                      }`}
                                    >
                                      {article.title}
                                    </h4>
                                    <p
                                      className={`text-xs ${
                                        currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                      }`}
                                    >
                                      {formatDateTime(article.createdAt)}
                                    </p>
                                  </Link>
                                ))}
                                {articles.length > 3 && (
                                  <Button variant="ghost" className="w-full mt-3" asChild>
                                    <Link
                                      href={`#articles`}
                                      onClick={() => setActiveTab('articles')}
                                    >
                                      查看全部 {articlesTotal} 篇文章
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <p
                                className={`text-center py-4 ${
                                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}
                              >
                                暂无发表的文章
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 最新曲谱 */}
                        <div
                          className={`p-6 rounded-2xl backdrop-blur-sm border ${
                            currentTheme === 'dark'
                              ? 'bg-white/5 border-white/10'
                              : 'bg-white/30 border-white/40'
                          }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
                          <div className="relative p-6">
                            <h3
                              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                                currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                              }`}
                            >
                              <Music className="w-5 h-5 text-purple-500" />
                              最新曲谱
                            </h3>
                            {tracks.length > 0 ? (
                              <div className="space-y-3">
                                {tracks.slice(0, 3).map((track) => {
                                  const trackData =
                                    typeof track.track === 'object' ? track.track : null
                                  return (
                                    <Link
                                      key={track.id}
                                      href={`/versions/${track.id}`}
                                      className={`block p-3 rounded-xl border transition-all duration-200 hover:scale-[1.02] ${
                                        currentTheme === 'dark'
                                          ? 'border-white/10 hover:bg-white/10'
                                          : 'border-white/40 hover:bg-white/50'
                                      }`}
                                    >
                                      <h4
                                        className={`font-medium mb-1 ${
                                          currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                                        }`}
                                      >
                                        {trackData?.title || '未知曲谱'}
                                      </h4>
                                      <p
                                        className={`text-xs ${
                                          currentTheme === 'dark'
                                            ? 'text-gray-400'
                                            : 'text-gray-600'
                                        }`}
                                      >
                                        {formatDateTime(track.createdAt)}
                                      </p>
                                    </Link>
                                  )
                                })}
                                {tracks.length > 3 && (
                                  <Button variant="ghost" className="w-full mt-3" asChild>
                                    <Link href={`#tracks`} onClick={() => setActiveTab('tracks')}>
                                      查看全部 {tracksTotal} 个曲谱
                                    </Link>
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <p
                                className={`text-center py-4 ${
                                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}
                              >
                                暂无上传的曲谱
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'articles' && (
                    <motion.div
                      key="articles"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-6">
                        <h2
                          className={`text-2xl font-bold ${
                            currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                          }`}
                        >
                          发表的文章
                        </h2>
                        <p
                          className={`text-sm mt-1 ${
                            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          共 {articlesTotal} 篇文章
                        </p>
                      </div>
                      {articles.length > 0 ? (
                        <div className="space-y-4">
                          {articles.map((article) => (
                            <Link
                              key={article.id}
                              href={`/articles/${article.id}`}
                              className={`block p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                                currentTheme === 'dark'
                                  ? 'border-white/10 hover:bg-white/10 bg-white/5'
                                  : 'border-white/40 hover:bg-white/50 bg-white/30'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <h3
                                  className={`font-semibold text-lg ${
                                    currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                                  }`}
                                >
                                  {article.title}
                                </h3>
                                <Badge
                                  variant={article.status === 'published' ? 'default' : 'secondary'}
                                  className={
                                    article.status === 'published'
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
                                      : undefined
                                  }
                                >
                                  {article.status === 'published' ? '已发布' : '草稿'}
                                </Badge>
                              </div>
                              <p
                                className={`text-sm ${
                                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                }`}
                              >
                                发布于 {formatDateTime(article.createdAt)}
                              </p>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div
                            className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                              currentTheme === 'dark' ? 'bg-white/10' : 'bg-white/30'
                            }`}
                          >
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                          <p
                            className={`${
                              currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            暂无发表的文章
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'tracks' && (
                    <motion.div
                      key="tracks"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="mb-6">
                        <h2
                          className={`text-2xl font-bold ${
                            currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                          }`}
                        >
                          上传的曲谱
                        </h2>
                        <p
                          className={`text-sm mt-1 ${
                            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          共 {tracksTotal} 个曲谱版本
                        </p>
                      </div>
                      {tracks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {tracks.map((track) => {
                            const trackData = typeof track.track === 'object' ? track.track : null
                            return (
                              <Link
                                key={track.id}
                                href={`/versions/${track.id}`}
                                className={`block p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                                  currentTheme === 'dark'
                                    ? 'border-white/10 hover:bg-white/10 bg-white/5'
                                    : 'border-white/40 hover:bg-white/50 bg-white/30'
                                }`}
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <h3
                                    className={`font-semibold text-lg ${
                                      currentTheme === 'dark' ? 'text-white' : 'text-gray-800'
                                    }`}
                                  >
                                    {trackData?.title || '未知曲谱'}
                                  </h3>
                                  <Badge
                                    variant="default"
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0"
                                  >
                                    曲谱版本
                                  </Badge>
                                </div>
                                <p
                                  className={`text-sm ${
                                    currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                  }`}
                                >
                                  创建于 {formatDateTime(track.createdAt)}
                                </p>
                              </Link>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div
                            className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                              currentTheme === 'dark' ? 'bg-white/10' : 'bg-white/30'
                            }`}
                          >
                            <Music className="w-8 h-8 text-gray-400" />
                          </div>
                          <p
                            className={`${
                              currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}
                          >
                            暂无上传的曲谱
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
