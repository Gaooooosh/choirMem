'use client'
import React from 'react'

import type { Props } from './types'

import { cn } from '@/utilities/ui'

export const VideoMedia: React.FC<Props> = (props) => {
  const { className, onClick, onLoad, resource } = props

  // If there is no resource, render nothing
  if (!resource) {
    return null
  }

  // If the resource is a string, use it as the src
  if (typeof resource === 'string') {
    return (
      <video
        className={cn(className)}
        controls
        onClick={onClick}
        onLoadedData={onLoad}
      >
        <source src={resource} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    )
  }

  // If the resource is an object, extract properties
  if (typeof resource === 'object' && resource !== null) {
    const { url, mimeType } = resource

    // If there is no URL, render nothing
    if (!url) {
      return null
    }

    return (
      <video
        className={cn(className)}
        controls
        onClick={onClick}
        onLoadedData={onLoad}
      >
        <source src={url} type={mimeType || 'video/mp4'} />
        Your browser does not support the video tag.
      </video>
    )
  }

  // Fallback to render nothing
  return null
}