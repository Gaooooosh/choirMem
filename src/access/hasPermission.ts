import { Access } from 'payload'
import { User } from '../payload-types'

export const hasPermission = (permission: string): Access => ({ req }) => {
  // 检查用户是否存在
  if (!req.user) {
    return false
  }

  // 如果用户是管理员，允许所有权限
  if (req.user.is_admin) {
    return true
  }

  // 检查用户是否有权限组，并且该权限组具有请求的权限
  // 增强类型安全检查
  if (req.user.group && typeof req.user.group === 'object' && req.user.group !== null) {
    // 确保权限字段存在且是布尔值
    const permissionValue = (req.user.group as any)[permission]
    if (typeof permissionValue === 'boolean') {
      return permissionValue
    }
    // 权限字段不存在或不是布尔值时返回 false
    return false
  }

  return false
}