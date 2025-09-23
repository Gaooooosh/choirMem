import sqlite3 from 'sqlite3'
import { promisify } from 'util'

// 旧系统数据结构定义
export interface OldUser {
  id: number
  username: string
  password_hash: string
  email?: string
  is_admin: boolean
  group_id: number
  avatar_filename: string
  bio?: string
  activity_score: number
  score_upload_count: number
  photo_upload_count: number
  comment_count: number
  last_seen: string
  has_seen_welcome: boolean
  about_me?: string
}

export interface OldPermissionGroup {
  id: number
  name: string
  can_view_scores: boolean
  can_upload_scores: boolean
  can_upload_photos: boolean
  can_post_comments: boolean
  can_create_tracks: boolean
}

export interface OldTrack {
  id: number
  title: string
  title_sort?: string
  description?: string
}

export interface OldVersion {
  id: number
  title: string
  notes?: string
  timestamp: string
  track_id: number
  user_id: number
}

export interface OldScore {
  id: number
  description?: string
  filename: string
  timestamp: string
  user_id: number
  version_id: number
}

export interface OldPhoto {
  id: number
  filename: string
  caption?: string
  timestamp: string
  version_id: number
  user_id: number
}

export interface OldTag {
  id: number
  name: string
}

export interface OldComment {
  id: number
  body: string
  timestamp: string
  user_id: number
  track_id?: number
  version_id?: number
}

export interface OldArticle {
  id: number
  title: string
  body: string
  timestamp: string
  user_id: number
}

export interface OldRating {
  id: number
  difficulty: number
  user_id: number
  version_id: number
}

export interface OldLike {
  user_id: number
  version_id: number
}

export interface OldVersionTag {
  version_id: number
  tag_id: number
}

export interface OldInvitationCode {
  id: number
  code: string
  created_at: string
  group_id: number
  total_uses: number
  uses_left: number
}

export interface OldSystemSetting {
  id: number
  key: string
  value: string
}

export interface OldAnnouncement {
  id: number
  content: string
  level: string
  is_active: boolean
  timestamp: string
}

export class OldDataReader {
  private db!: sqlite3.Database
  private all!: (sql: string, params?: any[]) => Promise<any[]>
  private get!: (sql: string, params?: any[]) => Promise<any>
  private connectionPromise: Promise<void>

  constructor(dbPath: string) {
    this.connectionPromise = new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('数据库连接失败:', err.message)
          reject(err)
        } else {
          console.log('成功连接到数据库:', dbPath)
          this.all = promisify(this.db.all.bind(this.db))
          this.get = promisify(this.db.get.bind(this.db))
          resolve()
        }
      })
    })
  }

  async waitForConnection(): Promise<void> {
    return this.connectionPromise
  }

  async getAllUsers(): Promise<OldUser[]> {
    return await this.all('SELECT * FROM user ORDER BY id')
  }

  async getAllPermissionGroups(): Promise<OldPermissionGroup[]> {
    return await this.all('SELECT * FROM permission_group ORDER BY id')
  }

  async getAllTracks(): Promise<OldTrack[]> {
    return await this.all('SELECT * FROM track ORDER BY id')
  }

  async getAllVersions(): Promise<OldVersion[]> {
    return await this.all('SELECT * FROM version ORDER BY id')
  }

  async getAllScores(): Promise<OldScore[]> {
    return await this.all('SELECT * FROM score ORDER BY id')
  }

  async getAllPhotos(): Promise<OldPhoto[]> {
    return await this.all('SELECT * FROM photo ORDER BY id')
  }

  async getAllTags(): Promise<OldTag[]> {
    return await this.all('SELECT * FROM tag ORDER BY id')
  }

  async getAllComments(): Promise<OldComment[]> {
    return await this.all('SELECT * FROM comment ORDER BY id')
  }

  async getAllArticles(): Promise<OldArticle[]> {
    return await this.all('SELECT * FROM article ORDER BY id')
  }

  async getAllRatings(): Promise<OldRating[]> {
    return await this.all('SELECT * FROM rating ORDER BY id')
  }

  async getAllLikes(): Promise<OldLike[]> {
    return await this.all('SELECT * FROM likes ORDER BY user_id, version_id')
  }

  async getAllVersionTags(): Promise<OldVersionTag[]> {
    return await this.all('SELECT * FROM version_tags ORDER BY version_id, tag_id')
  }

  async getAllInvitationCodes(): Promise<OldInvitationCode[]> {
    return await this.all('SELECT * FROM invitation_code ORDER BY id')
  }

  async getAllSystemSettings(): Promise<OldSystemSetting[]> {
    return await this.all('SELECT * FROM system_setting ORDER BY id')
  }

  async getAllAnnouncements(): Promise<OldAnnouncement[]> {
    return await this.all('SELECT * FROM announcement ORDER BY id')
  }

  async getDataCounts() {
    const counts = {
      users: await this.get('SELECT COUNT(*) as count FROM user'),
      tracks: await this.get('SELECT COUNT(*) as count FROM track'),
      versions: await this.get('SELECT COUNT(*) as count FROM version'),
      scores: await this.get('SELECT COUNT(*) as count FROM score'),
      photos: await this.get('SELECT COUNT(*) as count FROM photo'),
      comments: await this.get('SELECT COUNT(*) as count FROM comment'),
      tags: await this.get('SELECT COUNT(*) as count FROM tag'),
      articles: await this.get('SELECT COUNT(*) as count FROM article'),
      ratings: await this.get('SELECT COUNT(*) as count FROM rating'),
      likes: await this.get('SELECT COUNT(*) as count FROM likes'),
      permissionGroups: await this.get('SELECT COUNT(*) as count FROM permission_group'),
      invitationCodes: await this.get('SELECT COUNT(*) as count FROM invitation_code'),
      systemSettings: await this.get('SELECT COUNT(*) as count FROM system_setting'),
      announcements: await this.get('SELECT COUNT(*) as count FROM announcement'),
    }

    return Object.fromEntries(Object.entries(counts).map(([key, value]) => [key, value.count]))
  }

  /**
   * 获取各类数据的数量
   */
  async getUserCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM user')
    return result.count
  }

  async getPermissionGroupCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM permission_group')
    return result.count
  }

  async getTrackCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM track')
    return result.count
  }

  async getTrackVersionCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM version')
    return result.count
  }

  async getScoreCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM score')
    return result.count
  }

  async getPhotoCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM photo')
    return result.count
  }

  async getTagCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM tag')
    return result.count
  }

  async getCommentCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM comment')
    return result.count
  }

  async getArticleCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM article')
    return result.count
  }

  async getRatingCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM rating')
    return result.count
  }

  async getLikeCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM likes')
    return result.count
  }

  async getVersionTagCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM version_tags')
    return result.count
  }

  async getInvitationCodeCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM invitation_code')
    return result.count
  }

  async getSystemSettingCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM system_setting')
    return result.count
  }

  async getAnnouncementCount(): Promise<number> {
    const result = await this.get('SELECT COUNT(*) as count FROM announcement')
    return result.count
  }

  close() {
    this.db.close()
  }
}
