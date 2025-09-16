import { Endpoint } from 'payload'
import { submitEdit, approveEdit } from './edit'
import { rollbackToVersion, getEditHistory } from './rollback'
import { lockDocument, unlockDocument, checkLockStatus } from './lock'
import { 
  sendEditNotification, 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification, 
  getUnreadNotificationCount 
} from './notifications'
import { 
  getUserEditStats, 
  getGlobalEditStats, 
  getContributorLeaderboard 
} from './statistics'

export const wikiEndpoints: Endpoint[] = [
  {
    path: '/wiki/submit-edit',
    method: 'post',
    handler: submitEdit,
  },
  {
    path: '/wiki/approve-edit',
    method: 'post',
    handler: approveEdit,
  },
  {
    path: '/wiki/rollback',
    method: 'post',
    handler: rollbackToVersion,
  },
  {
    path: '/wiki/history',
    method: 'get',
    handler: getEditHistory,
  },
  {
    path: '/wiki/lock',
    method: 'post',
    handler: lockDocument,
  },
  {
    path: '/wiki/unlock',
    method: 'post',
    handler: unlockDocument,
  },
  {
    path: '/wiki/lock-status',
    method: 'get',
    handler: checkLockStatus,
  },
  {
    path: '/wiki/notifications/send',
    method: 'post',
    handler: sendEditNotification,
  },
  {
    path: '/wiki/notifications',
    method: 'get',
    handler: getUserNotifications,
  },
  {
    path: '/wiki/notifications/read',
    method: 'post',
    handler: markNotificationAsRead,
  },
  {
    path: '/wiki/notifications/read-all',
    method: 'post',
    handler: markAllNotificationsAsRead,
  },
  {
    path: '/wiki/notifications/delete',
    method: 'post',
    handler: deleteNotification,
  },
  {
    path: '/wiki/notifications/unread-count',
    method: 'get',
    handler: getUnreadNotificationCount,
  },
  {
    path: '/wiki/stats/user',
    method: 'post',
    handler: getUserEditStats,
  },
  {
    path: '/wiki/stats/global',
    method: 'post',
    handler: getGlobalEditStats,
  },
  {
    path: '/wiki/stats/leaderboard',
    method: 'post',
    handler: getContributorLeaderboard,
  },
]