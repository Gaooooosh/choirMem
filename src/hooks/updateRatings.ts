import type { CollectionAfterChangeHook } from 'payload'

export const updateRatings: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req: { payload, user },
}) => {
  // 只在创建或更新评分时处理
  if (operation === 'create' || operation === 'update') {
    const trackVersionId = doc.track_version
    const userId = user?.id
    const difficulty = doc.difficulty

    // 确保用户已登录
    if (!userId) {
      return doc
    }

    // 获取当前TrackVersion的ratings
    const trackVersion = await payload.findByID({
      collection: 'track-versions',
      id: trackVersionId,
    })

    // 初始化ratings数组
    let ratings = trackVersion.ratings || []
    
    // 如果是更新操作，先移除旧的评分
    if (operation === 'update') {
      ratings = ratings.filter((rating: any) => rating.id !== doc.id)
    }
    
    // 添加新的评分
    ratings.push({
      id: doc.id,
      user: userId,
      difficulty: difficulty,
    })

    // 更新TrackVersion的ratings字段
    await payload.update({
      collection: 'track-versions',
      id: trackVersionId,
      data: {
        ratings: ratings,
      },
    })
  }

  return doc
}