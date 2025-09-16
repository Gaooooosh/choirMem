
'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MasonryGridProps {
  children: React.ReactNode
  columns?: number
  gap?: string
  className?: string
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  children,
  columns = 3,
  gap = '1rem',
  className = '',
}) => {
  const columnStyle = {
    columnCount: columns,
    columnGap: gap,
    columnFill: 'balance' as const,
  }

  return (
    <div className={`masonry-grid ${className}`} style={columnStyle}>
      <AnimatePresence>
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return (
              <motion.div
                key={child.key || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="break-inside-avoid mb-4"
              >
                {child}
              </motion.div>
            )
          }
          return child
        })}
      </AnimatePresence>
    </div>
  )
}

export default MasonryGrid
