import { Access } from 'payload'
import { User } from '../payload-types'

/**
 * 允许用户更新自己的个人信息，或者管理员更新任何用户的信息
 */
export const canUpdateOwnProfile: Access = ({ req, id }) => {
  // 检查用户是否已登录
  if (!req.user) {
    return false
  }

  // 如果用户是管理员，允许更新任何用户的信息
  if (req.user.is_admin) {
    return true
  }

  // 如果用户有管理用户权限，允许更新任何用户的信息
  if (req.user.group && typeof req.user.group === 'object' && req.user.group !== null) {
    const canManageUsers = (req.user.group as any).can_manage_users
    if (canManageUsers) {
      return true
    }
  }

  // 否则，只允许用户更新自己的信息
  return String(req.user.id) === String(id)
}