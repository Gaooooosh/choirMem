'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'

import type { Header } from '@/payload-types'

import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()

  const pathname = usePathname()
  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-black/90 dark:bg-black/75 border-b border-white/20 dark:border-white/20 backdrop-saturate-150 backdrop-contrast-125"
      style={{
        backdropFilter: 'blur(6px) saturate(1.8) contrast(1.25) brightness(0.8)',
        boxShadow:
          '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 -1px 0 rgba(255, 255, 255, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        background:
          'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(20, 20, 20, 0.85) 50%, rgba(0, 0, 0, 0.9) 100%)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.5) contrast(1.25) brightness(1.1)',
      }}
      initial={{ y: -100, opacity: 0.5 }}
      animate={{ y: 0, opacity: 1.0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo 区域 */}
          <motion.div
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl">
                  <Music className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  爱乐爱家
                </h1>
                <p className="text-xs text-white/70 -mt-1">Back to Home</p>
              </div>
            </Link>
          </motion.div>

          {/* 导航区域 */}
          <div className="flex items-center space-x-6">
            <HeaderNav data={data} />
          </div>
        </div>
      </div>
    </motion.header>
  )
}
