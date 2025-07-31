import type { CollectionAfterChangeHook } from 'payload'

export const increaseActivityScore: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req: { payload },
}) => {
  // 只在创建时增加活动分数
  if (operation === 'create') {
    const userId = doc.uploader || doc.author || doc.creator || doc.user

    if (userId) {
      try {
        // 获取用户ID - 如果是对象则取其 id 属性
        const userIdStr = typeof userId === 'object' && userId.id ? String(userId.id) : String(userId)
        const user = await payload.findByID({
          collection: 'users',
          id: userIdStr,
          depth: 0,
        })

        // 增加活动分数 (每次增加10分)
        const newScore = (user.activity_score || 0) + 10

        // 更新用户的活动分数
        await payload.update({
          collection: 'users',
          id: userIdStr,
          data: {
            activity_score: newScore,
          },
        })
      } catch (error) {
        console.log(`⚠️ 无法为用户 ${userId} 增加活动分数:`, error)
      }
    }
  }

  return doc
}