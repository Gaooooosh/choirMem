import { PayloadRequest, getPayload } from 'payload'
import config from '@payload-config'

// 获取用户编辑统计
export const getUserEditStats = async (req: PayloadRequest) => {
  const payload = await getPayload({ config })
  
  try {
    const { user } = req
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!req.json) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    const body = await req.json()
    if (!body) {
      return Response.json({ error: 'Request body is required' }, { status: 400 })
    }

    const { userId, timeRange = '30d' } = body
    const targetUserId = userId || user.id

    // 计算时间范围
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // 获取编辑历史统计
    const editHistory = await payload.find({
      collection: 'edit-history',
      where: {
        and: [
          {
            editor: {
              equals: targetUserId,
            },
          },
          {
            createdAt: {
              greater_than: startDate.toISOString(),
            },
          },
        ],
      },
      limit: 1000,
    })

    // 获取待审核编辑统计
    const pendingEdits = await payload.find({
      collection: 'pending-edits',
      where: {
        and: [
          {
            editor: {
              equals: targetUserId,
            },
          },
          {
            createdAt: {
              greater_than: startDate.toISOString(),
            },
          },
        ],
      },
      limit: 1000,
    })

    // 统计数据
    const totalEdits = editHistory.totalDocs
    const pendingEditsCount = pendingEdits.totalDocs
    
    // 按类型分组统计
    const editsByType = editHistory.docs.reduce((acc: Record<string, number>, edit: any) => {
      const type = edit.edit_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    // 按集合分组统计
    const editsByCollection = editHistory.docs.reduce((acc: Record<string, number>, edit: any) => {
      const collection = edit.collection || 'unknown'
      acc[collection] = (acc[collection] || 0) + 1
      return acc
    }, {})

    // 按日期分组统计（用于图表）
    const editsByDate = editHistory.docs.reduce((acc: Record<string, number>, edit: any) => {
      const date = new Date(edit.createdAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    // 计算平均每日编辑数
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const avgEditsPerDay = totalEdits / daysDiff

    return Response.json({
      success: true,
      data: {
        totalEdits,
        pendingEditsCount,
        avgEditsPerDay: Math.round(avgEditsPerDay * 100) / 100,
        editsByType,
        editsByCollection,
        editsByDate,
        timeRange,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
    })
  } catch (error) {
    console.error('获取用户编辑统计失败:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 获取全局编辑统计
export const getGlobalEditStats = async (req: PayloadRequest) => {
  const payload = await getPayload({ config })
  
  try {
    const { user } = req
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!req.json) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    const body = await req.json()
    if (!body) {
      return Response.json({ error: 'Request body is required' }, { status: 400 })
    }

    const { timeRange = '30d' } = body

    // 计算时间范围
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // 获取编辑历史统计
    const editHistory = await payload.find({
      collection: 'edit-history',
      where: {
        createdAt: {
          greater_than: startDate.toISOString(),
        },
      },
      limit: 10000,
    })

    // 获取活跃贡献者
    const contributorStats = editHistory.docs.reduce((acc: Record<string, any>, edit: any) => {
      const editorId = edit.editor
      if (!acc[editorId]) {
        acc[editorId] = {
          editorId,
          editCount: 0,
          lastEditDate: edit.createdAt,
        }
      }
      acc[editorId].editCount += 1
      if (new Date(edit.createdAt) > new Date(acc[editorId].lastEditDate)) {
        acc[editorId].lastEditDate = edit.createdAt
      }
      return acc
    }, {})

    // 获取贡献者详细信息
    const contributorIds = Object.keys(contributorStats)
    const contributors = await payload.find({
      collection: 'users',
      where: {
        id: {
          in: contributorIds,
        },
      },
      limit: 100,
    })

    // 合并贡献者信息
    const topContributors = contributors.docs
      .map((user: any) => ({
        ...contributorStats[user.id],
        name: user.name || user.email,
        email: user.email,
      }))
      .sort((a, b) => b.editCount - a.editCount)
      .slice(0, 10)

    // 按日期分组统计
    const editsByDate = editHistory.docs.reduce((acc: Record<string, number>, edit: any) => {
      const date = new Date(edit.createdAt).toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {})

    // 按类型分组统计
    const editsByType = editHistory.docs.reduce((acc: Record<string, number>, edit: any) => {
      const type = edit.edit_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    // 按集合分组统计
    const editsByCollection = editHistory.docs.reduce((acc: Record<string, number>, edit: any) => {
      const collection = edit.collection || 'unknown'
      acc[collection] = (acc[collection] || 0) + 1
      return acc
    }, {})

    return Response.json({
      success: true,
      data: {
        totalEdits: editHistory.totalDocs,
        totalContributors: contributorIds.length,
        topContributors,
        editsByDate,
        editsByType,
        editsByCollection,
        timeRange,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      },
    })
  } catch (error) {
    console.error('获取全局编辑统计失败:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 获取贡献者排行榜
export const getContributorLeaderboard = async (req: PayloadRequest) => {
  const payload = await getPayload({ config })
  
  try {
    const { user } = req
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!req.json) {
      return Response.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    const body = await req.json()
    if (!body) {
      return Response.json({ error: 'Request body is required' }, { status: 400 })
    }

    const { timeRange = '30d', limit = 10 } = body

    // 计算时间范围
    const now = new Date()
    let startDate: Date
    
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        startDate = new Date(0)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // 获取编辑历史统计
    const editHistory = await payload.find({
      collection: 'edit-history',
      where: {
        createdAt: {
          greater_than: startDate.toISOString(),
        },
      },
      limit: 10000,
    })

    // 统计每个贡献者的编辑数据
    const contributorStats = editHistory.docs.reduce((acc: Record<string, any>, edit: any) => {
      const editorId = edit.editor
      if (!acc[editorId]) {
        acc[editorId] = {
          editorId,
          totalEdits: 0,
          editsByType: {},
          editsByCollection: {},
          firstEditDate: edit.createdAt,
          lastEditDate: edit.createdAt,
        }
      }
      
      acc[editorId].totalEdits += 1
      
      // 按类型统计
      const type = edit.edit_type || 'unknown'
      acc[editorId].editsByType[type] = (acc[editorId].editsByType[type] || 0) + 1
      
      // 按集合统计
      const collection = edit.collection || 'unknown'
      acc[editorId].editsByCollection[collection] = (acc[editorId].editsByCollection[collection] || 0) + 1
      
      // 更新时间范围
      if (new Date(edit.createdAt) < new Date(acc[editorId].firstEditDate)) {
        acc[editorId].firstEditDate = edit.createdAt
      }
      if (new Date(edit.createdAt) > new Date(acc[editorId].lastEditDate)) {
        acc[editorId].lastEditDate = edit.createdAt
      }
      
      return acc
    }, {})

    // 获取贡献者详细信息
    const contributorIds = Object.keys(contributorStats)
    const contributors = await payload.find({
      collection: 'users',
      where: {
        id: {
          in: contributorIds,
        },
      },
      limit: 1000,
    })

    // 合并贡献者信息并排序
    const leaderboard = contributors.docs
      .map((user: any, index: number) => ({
        rank: 0, // 将在排序后设置
        ...contributorStats[user.id],
        name: user.name || user.email,
        email: user.email,
        avatar: user.avatar,
      }))
      .sort((a, b) => b.totalEdits - a.totalEdits)
      .slice(0, limit)
      .map((contributor, index) => ({
        ...contributor,
        rank: index + 1,
      }))

    return Response.json({
      success: true,
      data: {
        leaderboard,
        timeRange,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        totalContributors: contributorIds.length,
      },
    })
  } catch (error) {
    console.error('获取贡献者排行榜失败:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}