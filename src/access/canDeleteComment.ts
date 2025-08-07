import type { AccessArgs } from 'payload'
import type { User, Comment } from '@/payload-types'

type CanDeleteComment = (args: AccessArgs<User>) => boolean

export const canDeleteComment: CanDeleteComment = ({ req: { user }, data }) => {
  // 必须是已认证用户
  if (!user) return false
  
  // 管理员可以删除任何评论
  if (user.is_admin) return true
  
  // 评论作者可以删除自己的评论
  const comment = data as unknown as Comment
  if (comment && comment.author) {
    // 处理author可能是ID或对象的情况
    const authorId = typeof comment.author === 'object' ? comment.author.id : comment.author
    return String(user.id) === String(authorId)
  }
  
  return false
}