import fs from 'fs'
import path from 'path'
import { copyFile, ensureDirectoryExists, fileExists, isImageFile, isPdfFile, Logger } from './utils'

export interface FileMigrationResult {
  success: boolean
  originalPath: string
  newPath?: string
  error?: string
}

export class FileMigrator {
  private oldDataPath: string
  private newUploadsPath: string

  constructor(oldDataPath: string, newUploadsPath: string) {
    this.oldDataPath = oldDataPath
    this.newUploadsPath = newUploadsPath
    
    // 确保新的上传目录及子目录存在
    ensureDirectoryExists(this.newUploadsPath)
    ensureDirectoryExists(path.join(this.newUploadsPath, 'avatars'))
    ensureDirectoryExists(path.join(this.newUploadsPath, 'scores'))
    ensureDirectoryExists(path.join(this.newUploadsPath, 'media'))
  }

  // 迁移用户头像
  migrateUserAvatar(avatarFilename: string): FileMigrationResult {
    if (!avatarFilename || avatarFilename.trim() === '') {
      return {
        success: false,
        originalPath: '',
        error: 'Empty avatar filename'
      }
    }

    const oldPath = path.join(this.oldDataPath, avatarFilename)
    const newPath = path.join(this.newUploadsPath, 'avatars', avatarFilename)

    if (!fileExists(oldPath)) {
      Logger.warn(`Avatar file not found: ${oldPath}`)
      return {
        success: false,
        originalPath: oldPath,
        error: 'File not found'
      }
    }

    try {
      copyFile(oldPath, newPath)
      Logger.info(`Migrated avatar: ${avatarFilename}`)
      return {
        success: true,
        originalPath: oldPath,
        newPath
      }
    } catch (error) {
      Logger.error(`Failed to migrate avatar: ${avatarFilename}`, error)
      return {
        success: false,
        originalPath: oldPath,
        error: (error as Error).message
      }
    }
  }

  // 迁移乐谱文件（PDF）
  migrateScoreFile(filename: string): FileMigrationResult {
    if (!filename || filename.trim() === '') {
      return {
        success: false,
        originalPath: '',
        error: 'Empty score filename'
      }
    }

    const oldPath = path.join(this.oldDataPath, filename)
    const newPath = path.join(this.newUploadsPath, 'scores', filename)

    if (!fileExists(oldPath)) {
      Logger.warn(`Score file not found: ${oldPath}`)
      return {
        success: false,
        originalPath: oldPath,
        error: 'File not found'
      }
    }

    if (!isPdfFile(filename)) {
      Logger.warn(`Score file is not PDF: ${filename}`)
      return {
        success: false,
        originalPath: oldPath,
        error: 'Not a PDF file'
      }
    }

    try {
      copyFile(oldPath, newPath)
      Logger.info(`Migrated score: ${filename}`)
      return {
        success: true,
        originalPath: oldPath,
        newPath
      }
    } catch (error) {
      Logger.error(`Failed to migrate score: ${filename}`, error)
      return {
        success: false,
        originalPath: oldPath,
        error: (error as Error).message
      }
    }
  }

  // 迁移照片文件
  migratePhotoFile(filename: string): FileMigrationResult {
    if (!filename || filename.trim() === '') {
      return {
        success: false,
        originalPath: '',
        error: 'Empty photo filename'
      }
    }

    const oldPath = path.join(this.oldDataPath, filename)
    const newPath = path.join(this.newUploadsPath, 'media', filename)

    if (!fileExists(oldPath)) {
      Logger.warn(`Photo file not found: ${oldPath}`)
      return {
        success: false,
        originalPath: oldPath,
        error: 'File not found'
      }
    }

    if (!isImageFile(filename)) {
      Logger.warn(`Photo file is not an image: ${filename}`)
      return {
        success: false,
        originalPath: oldPath,
        error: 'Not an image file'
      }
    }

    try {
      copyFile(oldPath, newPath)
      Logger.info(`Migrated photo: ${filename}`)
      return {
        success: true,
        originalPath: oldPath,
        newPath
      }
    } catch (error) {
      Logger.error(`Failed to migrate photo: ${filename}`, error)
      return {
        success: false,
        originalPath: oldPath,
        error: (error as Error).message
      }
    }
  }

  // 批量迁移文件
  async migrateBatch(
    files: Array<{ filename: string; type: 'avatar' | 'score' | 'photo' }>,
    onProgress?: (processed: number, total: number) => void
  ): Promise<FileMigrationResult[]> {
    const results: FileMigrationResult[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      let result: FileMigrationResult
      
      switch (file.type) {
        case 'avatar':
          result = this.migrateUserAvatar(file.filename)
          break
        case 'score':
          result = this.migrateScoreFile(file.filename)
          break
        case 'photo':
          result = this.migratePhotoFile(file.filename)
          break
        default:
          result = {
            success: false,
            originalPath: file.filename,
            error: `Unknown file type: ${file.type}`
          }
      }
      
      results.push(result)
      
      if (onProgress) {
        onProgress(i + 1, files.length)
      }
    }
    
    return results
  }

  // 获取迁移统计
  getMigrationStats(results: FileMigrationResult[]) {
    const stats = {
      total: results.length,
      success: 0,
      failed: 0,
      errors: [] as string[]
    }
    
    for (const result of results) {
      if (result.success) {
        stats.success++
      } else {
        stats.failed++
        if (result.error) {
          stats.errors.push(`${result.originalPath}: ${result.error}`)
        }
      }
    }
    
    return stats
  }

  // 验证文件迁移完整性
  verifyMigration(originalPath: string, newPath: string): boolean {
    if (!fileExists(originalPath) || !fileExists(newPath)) {
      return false
    }
    
    try {
      const originalStats = fs.statSync(originalPath)
      const newStats = fs.statSync(newPath)
      
      // 比较文件大小
      return originalStats.size === newStats.size
    } catch {
      return false
    }
  }

  // 清理失败的迁移文件
  cleanupFailedMigrations(results: FileMigrationResult[]) {
    const failedResults = results.filter(r => !r.success && r.newPath)
    
    for (const result of failedResults) {
      try {
        if (result.newPath && fileExists(result.newPath)) {
          fs.unlinkSync(result.newPath)
          Logger.info(`Cleaned up failed migration: ${result.newPath}`)
        }
      } catch (error) {
        Logger.warn(`Failed to cleanup file ${result.newPath}:`, error)
      }
    }
  }

  // 获取文件迁移统计信息
  getStats() {
    return {
      oldDataPath: this.oldDataPath,
      newUploadsPath: this.newUploadsPath,
      uploadsDirectoryExists: fileExists(this.newUploadsPath)
    }
  }

  // 清理临时文件和资源
   async cleanup(): Promise<void> {
     try {
       Logger.info('文件迁移器清理完成')
     } catch (error) {
       Logger.warn('文件迁移器清理时出现警告:', error)
     }
   }
}