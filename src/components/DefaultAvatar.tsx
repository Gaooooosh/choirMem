'use client'

import React from 'react'
import { 
  Music, 
  Mic, 
  Piano, 
  Guitar,
  Drum,
  Volume2,
  Wind,
  Zap
} from 'lucide-react'

interface DefaultAvatarProps {
  type: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const avatarIcons = {
  'music-note': Music,
  'microphone': Mic,
  'piano': Piano,
  'violin': Volume2,
  'guitar': Guitar,
  'drums': Drum,
  'saxophone': Wind,
  'trumpet': Volume2,
  'flute': Wind,
  'cello': Volume2,
}

const avatarColors = {
  'music-note': 'from-blue-500 to-purple-600',
  'microphone': 'from-red-500 to-pink-600',
  'piano': 'from-gray-700 to-gray-900',
  'violin': 'from-amber-500 to-orange-600',
  'guitar': 'from-green-500 to-emerald-600',
  'drums': 'from-yellow-500 to-orange-500',
  'saxophone': 'from-purple-500 to-indigo-600',
  'trumpet': 'from-yellow-400 to-yellow-600',
  'flute': 'from-cyan-500 to-blue-600',
  'cello': 'from-rose-500 to-pink-600',
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
}

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

export const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ 
  type, 
  size = 'md', 
  className = '' 
}) => {
  const IconComponent = avatarIcons[type as keyof typeof avatarIcons] || Music
  const colorClass = avatarColors[type as keyof typeof avatarColors] || avatarColors['music-note']
  const sizeClass = sizeClasses[size]
  const iconSize = iconSizes[size]

  return (
    <div 
      className={`${sizeClass} rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg ${className}`}
    >
      <IconComponent className={`${iconSize} text-white`} />
    </div>
  )
}

export default DefaultAvatar