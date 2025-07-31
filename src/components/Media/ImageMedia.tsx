'use client'
import NextImage from 'next/image'
import React, { useState, useEffect } from 'react'

import type { Props } from './types'

import { cn } from '@/utilities/ui'

export const ImageMedia: React.FC<Props> = (props) => {
  const {
    alt: altFromProps,
    className,
    fill,
    imgClassName,
    onClick,
    onLoad,
    loading,
    priority,
    resource,
    size,
    src,
  } = props

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // If there is no resource or src, render nothing
  if (!resource && !src) {
    return null
  }

  // If the resource is a string, use it as the src
  if (typeof resource === 'string') {
    return (
      <img
        alt={altFromProps || 'Image'}
        className={cn(imgClassName)}
        loading={loading}
        onClick={onClick}
        onLoad={onLoad}
        src={resource}
      />
    )
  }

  // If src is a static image, use NextImage directly
  if (src) {
    return (
      <NextImage
        alt={altFromProps || ''}
        className={cn(imgClassName)}
        fill={fill}
        loading={loading}
        onClick={onClick}
        onLoad={onLoad}
        priority={priority}
        sizes={size}
        src={src}
      />
    )
  }

  // If the resource is an object, extract properties
  if (typeof resource === 'object' && resource !== null) {
    const { alt = '', url, width, height, sizes } = resource

    // If there is no URL, render nothing
    if (!url) {
      return null
    }

    // If fill is true, use NextImage with fill prop
    if (fill) {
      return (
        <div className={cn(className)}>
          <NextImage
            alt={altFromProps || alt || 'Image'}
            className={cn(imgClassName)}
            fill
            loading={loading}
            onClick={onClick}
            onLoad={onLoad}
            priority={priority}
            sizes={size}
            src={url}
          />
        </div>
      )
    }

    // If width and height are available, use NextImage with width and height
    if (width && height && isClient) {
      return (
        <NextImage
          alt={altFromProps || alt || 'Image'}
          className={cn(imgClassName)}
          height={height}
          loading={loading}
          onClick={onClick}
          onLoad={onLoad}
          priority={priority}
          sizes={size}
          src={url}
          width={width}
        />
      )
    }

    // Fallback to regular img tag
    return (
      <img
        alt={altFromProps || alt || 'Image'}
        className={cn(imgClassName)}
        loading={loading}
        onClick={onClick}
        onLoad={onLoad}
        src={url}
      />
    )
  }

  // Fallback to render nothing
  return null
}