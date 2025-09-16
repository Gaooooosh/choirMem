
'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

interface SearchFiltersProps {
  filters: {
    search: string
    category: string
    sortBy: string
    dateRange: {
      from: string
      to: string
    }
    tags: string[]
  }
  updateFilters: (newFilters: Partial<SearchFiltersProps['filters']>) => void
  onReset: () => void
  className?: string
}

const categories = [
  { value: 'all', label: '全部分类' },
  { value: 'classical', label: '古典音乐' },
  { value: 'folk', label: '民歌' },
  { value: 'modern', label: '现代音乐' },
  { value: 'religious', label: '宗教音乐' },
]

const sortOptions = [
  { value: 'newest', label: '最新创建' },
  { value: 'oldest', label: '最早创建' },
  { value: 'title', label: '标题排序' },
  { value: 'popular', label: '最受欢迎' },
]

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  updateFilters,
  onReset,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const handleAddTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      updateFilters({
        tags: [...filters.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    updateFilters({
      tags: filters.tags.filter(tag => tag !== tagToRemove),
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag()
    }
  }

  const hasActiveFilters = 
    filters.search ||
    filters.category !== 'all' ||
    filters.sortBy !== 'newest' ||
    filters.dateRange.from ||
    filters.dateRange.to ||
    filters.tags.length > 0

  return (
    <Card className={`search-filters ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="w-5 h-5" />
            搜索过滤器
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {[
                  filters.search && '搜索',
                  filters.category !== 'all' && '分类',
                  filters.sortBy !== 'newest' && '排序',
                  filters.dateRange.from && '日期',
                  filters.tags.length > 0 && `标签(${filters.tags.length})`,
                ].filter(Boolean).length} 个筛选条件
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                重置
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent className="space-y-4">
              {/* 搜索框 */}
              <div className="space-y-2">
                <Label htmlFor="search">搜索关键词</Label>
                <Input
                  id="search"
                  placeholder="输入搜索关键词..."
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                />
              </div>

              {/* 分类选择 */}
              <div className="space-y-2">
                <Label>分类</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => updateFilters({ category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 排序方式 */}
              <div className="space-y-2">
                <Label>排序方式</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => updateFilters({ sortBy: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择排序方式" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 标签管理 */}
              <div className="space-y-2">
                <Label>标签</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="添加标签..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    添加
                  </Button>
                </div>
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100 hover:text-red-800"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 日期范围 */}
              <div className="space-y-2">
                <Label>日期范围</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                      开始日期
                    </Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={filters.dateRange.from}
                      onChange={(e) =>
                        updateFilters({
                          dateRange: { ...filters.dateRange, from: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                      结束日期
                    </Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={filters.dateRange.to}
                      onChange={(e) =>
                        updateFilters({
                          dateRange: { ...filters.dateRange, to: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export default SearchFilters
