'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, TrendingUp, Users, Calendar, Award, Edit3 } from 'lucide-react'
import { useAuth } from '@/providers/Auth'

interface UserStats {
  totalEdits: number
  approvedEdits: number
  pendingEdits: number
  rejectedEdits: number
  approvalRate: number
  editsByType: {
    track_description: number
    track_version: number
  }
  recentActivity: Array<{
    date: string
    action: string
    target: string
  }>
}

interface GlobalStats {
  totalEdits: number
  totalUsers: number
  averageEditsPerUser: number
  approvalRate: number
  editsByType: {
    track_description: number
    track_version: number
  }
  editsByTimeRange: Array<{
    date: string
    count: number
  }>
}

interface Contributor {
  id: string
  name: string
  email: string
  avatar?: string
  totalEdits: number
  approvedEdits: number
  approvalRate: number
  rank: number
}

type TimeRange = '7d' | '30d' | '90d' | '1y'

const EditStatistics: React.FC = () => {
  const { user } = useAuth()
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [contributors, setContributors] = useState<Contributor[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')

  const timeRangeLabels = {
    '7d': '最近7天',
    '30d': '最近30天',
    '90d': '最近90天',
    '1y': '最近1年'
  }

  const fetchUserStats = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/wiki/stats/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeRange }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    }
  }

  const fetchGlobalStats = async () => {
    try {
      const response = await fetch('/api/wiki/stats/global', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeRange }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setGlobalStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch global stats:', error)
    }
  }

  const fetchContributors = async () => {
    try {
      const response = await fetch('/api/wiki/stats/leaderboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeRange, limit: 20 }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setContributors(data.contributors || [])
      }
    } catch (error) {
      console.error('Failed to fetch contributors:', error)
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchUserStats(),
      fetchGlobalStats(),
      fetchContributors()
    ])
    setLoading(false)
  }

  useEffect(() => {
    fetchAllData()
  }, [timeRange, user])

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500'
    if (rank === 2) return 'bg-gray-400'
    if (rank === 3) return 'bg-amber-600'
    return 'bg-blue-500'
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">请先登录以查看编辑统计</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">编辑统计</h1>
          <p className="text-muted-foreground">查看您的编辑活动和社区贡献</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(timeRangeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={fetchAllData} disabled={loading}>
            {loading ? '刷新中...' : '刷新数据'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">个人统计</TabsTrigger>
          <TabsTrigger value="global">全局统计</TabsTrigger>
          <TabsTrigger value="leaderboard">贡献排行</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          {userStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总编辑数</CardTitle>
                    <Edit3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats.totalEdits}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">通过率</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPercentage(userStats.approvalRate)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">已通过</CardTitle>
                    <BarChart3 className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{userStats.approvedEdits}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">待审核</CardTitle>
                    <Calendar className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{userStats.pendingEdits}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>编辑类型分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>曲目描述</span>
                        <Badge variant="secondary">{userStats.editsByType.track_description}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>版本信息</span>
                        <Badge variant="secondary">{userStats.editsByType.track_version}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>最近活动</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {userStats.recentActivity.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{activity.action}</span>
                          <span className="font-medium">{activity.target}</span>
                        </div>
                      ))}
                      {userStats.recentActivity.length === 0 && (
                        <p className="text-muted-foreground text-sm">暂无最近活动</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="global" className="space-y-6">
          {globalStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总编辑数</CardTitle>
                    <Edit3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{globalStats.totalEdits}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{globalStats.totalUsers}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">平均编辑数</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{globalStats.averageEditsPerUser.toFixed(1)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">整体通过率</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPercentage(globalStats.approvalRate)}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>编辑类型分布</CardTitle>
                  <CardDescription>社区编辑活动的类型分布</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>曲目描述编辑</span>
                      <Badge variant="secondary">{globalStats.editsByType.track_description}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>版本信息编辑</span>
                      <Badge variant="secondary">{globalStats.editsByType.track_version}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                贡献者排行榜
              </CardTitle>
              <CardDescription>
                {timeRangeLabels[timeRange]}内最活跃的贡献者
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contributors.map((contributor) => (
                  <div key={contributor.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={contributor.avatar} />
                          <AvatarFallback>{getInitials(contributor.name)}</AvatarFallback>
                        </Avatar>
                        {contributor.rank <= 3 && (
                          <Badge 
                            className={`absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs text-white ${getRankBadgeColor(contributor.rank)}`}
                          >
                            {contributor.rank}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{contributor.name}</p>
                        <p className="text-sm text-muted-foreground">{contributor.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{contributor.totalEdits} 次编辑</p>
                      <p className="text-sm text-muted-foreground">
                        通过率: {formatPercentage(contributor.approvalRate)}
                      </p>
                    </div>
                  </div>
                ))}
                {contributors.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    暂无贡献者数据
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EditStatistics