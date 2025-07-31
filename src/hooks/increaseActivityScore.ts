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
      // 获取用户当前的活动分数
      const user = await payload.findByID({
        collection: 'users',
        id: userId,
        depth: 0,
      })

      // 增加活动分数 (每次增加10分)
      const newScore = (user.activity_score || 0) + 10

      // 更新用户的活动分数
      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          activity_score: newScore,
        },
      })
    }
  }

  return doc
}