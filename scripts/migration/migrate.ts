import { getPayload } from 'payload'
import { config as dotenvConfig } from 'dotenv'
import { OldDataReader } from './old-data-reader'

// 确保环境变量被加载
dotenvConfig()
import { DataTransformer } from './data-transformer'
import { FileMigrator } from './file-migrator'
import { IdMapper } from './id-mapper'
import { Logger, delay } from './utils'
import path from 'path'
import fs from 'fs'

/**
 * 主迁移脚本
 * 负责协调整个数据迁移过程
 */
export class MigrationManager {
  private payload!: any
  private oldDataReader!: OldDataReader
  private idMapper!: IdMapper
  private fileMigrator!: FileMigrator
  private dataTransformer!: DataTransformer

  constructor(
    private oldDbPath: string = './old-database.db',
    private oldFilesPath: string = './old-files',
    private newFilesPath: string = './uploads',
  ) {
    // 初始化将在 initializePayload 方法中完成
  }

  /**
   * 初始化 Payload 和相关组件
   */
  private async initializePayload(): Promise<void> {
    Logger.info('正在初始化 Payload...')

    try {
      // 动态导入配置文件
      const configModule = await import('../../src/payload.config')
      const config = configModule.default

      this.payload = await getPayload({ config })

      // 初始化其他组件
      this.oldDataReader = new OldDataReader(this.oldDbPath)
      this.idMapper = new IdMapper()
      this.fileMigrator = new FileMigrator(this.oldFilesPath, this.newFilesPath)
      this.dataTransformer = new DataTransformer(this.idMapper, this.fileMigrator, this.payload)

      Logger.info('所有组件初始化完成')
    } catch (error) {
      Logger.error('初始化失败:', error)
      throw error
    }
  }

  /**
   * 验证迁移前提条件
   */
  private async validatePreconditions(): Promise<boolean> {
    Logger.info('正在验证迁移前提条件...')

    // 检查旧数据库文件
    if (!fs.existsSync(this.oldDbPath)) {
      Logger.error(`旧数据库文件不存在: ${this.oldDbPath}`)
      return false
    }

    // 检查旧文件目录
    if (!fs.existsSync(this.oldFilesPath)) {
      Logger.error(`旧文件目录不存在: ${this.oldFilesPath}`)
      return false
    }

    // 确保新文件目录存在
    if (!fs.existsSync(this.newFilesPath)) {
      fs.mkdirSync(this.newFilesPath, { recursive: true })
      Logger.info(`创建新文件目录: ${this.newFilesPath}`)
    }

    // 测试数据库连接
    try {
      await this.oldDataReader.waitForConnection()
      const userCount = await this.oldDataReader.getUserCount()
      Logger.info(`旧系统中共有 ${userCount} 个用户`)
    } catch (error) {
      Logger.error('无法连接到旧数据库:', error)
      return false
    }

    Logger.info('前提条件验证通过')
    return true
  }

  /**
   * 生成迁移报告
   */
  private async generateMigrationReport(): Promise<void> {
    Logger.info('正在生成迁移报告...')

    const stats = {
      users: await this.oldDataReader.getUserCount(),
      permissionGroups: await this.oldDataReader.getPermissionGroupCount(),
      tracks: await this.oldDataReader.getTrackCount(),
      trackVersions: await this.oldDataReader.getTrackVersionCount(),
      scores: await this.oldDataReader.getScoreCount(),
      photos: await this.oldDataReader.getPhotoCount(),
      tags: await this.oldDataReader.getTagCount(),
      comments: await this.oldDataReader.getCommentCount(),
      articles: await this.oldDataReader.getArticleCount(),
      ratings: await this.oldDataReader.getRatingCount(),
      likes: await this.oldDataReader.getLikeCount(),
      versionTags: await this.oldDataReader.getVersionTagCount(),
      invitationCodes: await this.oldDataReader.getInvitationCodeCount(),
      systemSettings: await this.oldDataReader.getSystemSettingCount(),
      announcements: await this.oldDataReader.getAnnouncementCount(),
    }

    const reportPath = path.join(process.cwd(), 'migration-report.json')
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          oldDataStats: stats,
          estimatedMigrationTime: this.estimateMigrationTime(stats),
        },
        null,
        2,
      ),
    )

    Logger.info(`迁移报告已生成: ${reportPath}`)
    Logger.info('数据统计:', stats)
  }

  /**
   * 估算迁移时间
   */
  private estimateMigrationTime(stats: any): string {
    // 基于经验的时间估算（秒）
    const timeEstimate =
      stats.users * 0.5 +
      stats.tracks * 0.3 +
      stats.trackVersions * 0.4 +
      stats.scores * 0.2 +
      stats.photos * 0.1 +
      stats.comments * 0.1 +
      stats.articles * 0.2

    const minutes = Math.ceil(timeEstimate / 60)
    return `约 ${minutes} 分钟`
  }

  /**
   * 执行完整迁移
   */
  async migrate(): Promise<void> {
    const startTime = Date.now()
    Logger.info('开始数据迁移...')

    try {
      // 1. 初始化 Payload 和组件
      await this.initializePayload()

      // 2. 验证前提条件
      if (!(await this.validatePreconditions())) {
        throw new Error('前提条件验证失败')
      }

      // 3. 生成迁移报告
      await this.generateMigrationReport()

      // 4. 按顺序迁移数据（考虑依赖关系）
      await this.migrateInOrder()

      // 5. 验证迁移结果
      await this.validateMigration()

      // 6. 保存 ID 映射
      await this.saveIdMappings()

      const duration = (Date.now() - startTime) / 1000
      Logger.info(`迁移完成！总耗时: ${duration.toFixed(2)} 秒`)
    } catch (error) {
      Logger.error('迁移失败:', error)
      throw error
    } finally {
      // 清理资源
      await this.cleanup()
    }
  }

  /**
   * 按依赖顺序迁移数据
   */
  private async migrateInOrder(): Promise<void> {
    Logger.info('开始按顺序迁移数据...')

    // 1. 权限组（无依赖）
    Logger.info('迁移权限组...')
    const oldGroups = await this.oldDataReader.getAllPermissionGroups()
    await this.dataTransformer.migratePermissionGroups(oldGroups)
    await delay(1000)

    // 2. 用户（依赖权限组）
    Logger.info('迁移用户...')
    const oldUsers = await this.oldDataReader.getAllUsers()
    await this.dataTransformer.migrateUsers(oldUsers)
    await delay(1000)

    // 3. 标签（无依赖）
    Logger.info('迁移标签...')
    const oldTags = await this.oldDataReader.getAllTags()
    await this.dataTransformer.migrateTags(oldTags)
    await delay(1000)

    // 4. 曲目（依赖用户）
    Logger.info('迁移曲目...')
    const oldTracks = await this.oldDataReader.getAllTracks()
    await this.dataTransformer.migrateTracks(oldTracks)
    await delay(1000)

    // 5. 曲目版本（依赖曲目、用户、标签）
    Logger.info('迁移曲目版本...')
    const oldVersions = await this.oldDataReader.getAllVersions()
    const oldLikes = await this.oldDataReader.getAllLikes()
    const oldRatings = await this.oldDataReader.getAllRatings()
    const oldVersionTags = await this.oldDataReader.getAllVersionTags()
    await this.dataTransformer.migrateTrackVersions(
      oldVersions,
      oldLikes,
      oldRatings,
      oldVersionTags,
    )
    await delay(1000)

    // 6. 乐谱（依赖曲目版本、用户）
    Logger.info('迁移乐谱...')
    const oldScores = await this.oldDataReader.getAllScores()
    await this.dataTransformer.migrateScores(oldScores)
    await delay(1000)

    // 7. 照片/媒体（依赖曲目版本、用户）
    Logger.info('迁移照片/媒体...')
    const oldPhotos = await this.oldDataReader.getAllPhotos()
    await this.dataTransformer.migratePhotosToMedia(oldPhotos)
    await delay(1000)

    // 8. 评论（依赖曲目、曲目版本、用户）
    Logger.info('迁移评论...')
    const oldComments = await this.oldDataReader.getAllComments()
    await this.dataTransformer.migrateComments(oldComments)
    await delay(1000)

    // 9. 文章（依赖用户、标签）
    Logger.info('迁移文章...')
    const oldArticles = await this.oldDataReader.getAllArticles()
    await this.dataTransformer.migrateArticles(oldArticles)
    await delay(1000)

    // 10. 邀请码（依赖权限组）
    Logger.info('迁移邀请码...')
    const oldCodes = await this.oldDataReader.getAllInvitationCodes()
    await this.dataTransformer.migrateInvitationCodes(oldCodes)
    await delay(1000)

    // 11. 系统设置（无依赖）
    Logger.info('迁移系统设置...')
    const oldSettings = await this.oldDataReader.getAllSystemSettings()
    await this.dataTransformer.migrateSystemSettings(oldSettings)

    Logger.info('所有数据迁移完成')
  }

  /**
   * 验证迁移结果
   */
  private async validateMigration(): Promise<void> {
    Logger.info('正在验证迁移结果...')

    try {
      // 验证关键数据的数量
      const newUserCount = await this.payload.count({ collection: 'users' })
      const oldUserCount = await this.oldDataReader.getUserCount()

      if (newUserCount.totalDocs !== oldUserCount) {
        Logger.warn(`用户数量不匹配: 旧系统 ${oldUserCount}, 新系统 ${newUserCount.totalDocs}`)
      } else {
        Logger.info(`用户迁移验证通过: ${newUserCount.totalDocs} 个用户`)
      }

      // 验证文件迁移
      const fileStats = this.fileMigrator.getStats()
      Logger.info('文件迁移统计:', fileStats)

      // 验证 ID 映射完整性
      const mappingStats = this.idMapper.getStats()
      Logger.info('ID 映射统计:', mappingStats)

      Logger.info('迁移验证完成')
    } catch (error) {
      Logger.error('迁移验证失败:', error)
      throw error
    }
  }

  /**
   * 保存 ID 映射到文件
   */
  private async saveIdMappings(): Promise<void> {
    const mappingPath = path.join(process.cwd(), 'id-mappings.json')
    const mappings = this.idMapper.exportMappings()
    fs.writeFileSync(mappingPath, JSON.stringify(mappings, null, 2))
    Logger.info(`ID 映射已保存到: ${mappingPath}`)
  }

  /**
   * 清理资源
   */
  private async cleanup(): Promise<void> {
    Logger.info('正在清理资源...')

    try {
      // 关闭数据库连接
      this.oldDataReader.close()

      // 清理临时文件
      await this.fileMigrator.cleanup()

      Logger.info('资源清理完成')
    } catch (error) {
      Logger.warn('资源清理时出现警告:', error)
    }
  }

  /**
   * 回滚迁移（紧急情况下使用）
   */
  async rollback(): Promise<void> {
    Logger.warn('开始回滚迁移...')

    try {
      await this.initializePayload()

      // 删除所有迁移的数据（按相反顺序）
      const collections = [
        'invitation-codes',
        'articles',
        'comments',
        'media',
        'scores',
        'track-versions',
        'tracks',
        'tags',
        'users',
        'permission-groups',
      ]

      for (const collection of collections) {
        try {
          const { docs } = await this.payload.find({ collection, limit: 1000 })
          for (const doc of docs) {
            await this.payload.delete({ collection, id: doc.id })
          }
          Logger.info(`已清空集合: ${collection}`)
        } catch (error) {
          Logger.warn(`清空集合 ${collection} 时出错:`, error)
        }
      }

      // 清理迁移的文件
      await this.fileMigrator.cleanup()

      Logger.info('回滚完成')
    } catch (error) {
      Logger.error('回滚失败:', error)
      throw error
    }
  }
}

/**
 * 命令行入口
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.log('使用方法: npm run migrate <旧数据库路径> <旧文件目录> <新文件目录>')
    console.log('示例: npm run migrate ./old-system.db ./old-files ./uploads')
    process.exit(1)
  }

  const [oldDbPath, oldFilesPath, newFilesPath] = args
  const migrationManager = new MigrationManager(oldDbPath, oldFilesPath, newFilesPath)

  try {
    if (args.includes('--rollback')) {
      await migrationManager.rollback()
    } else {
      await migrationManager.migrate()
    }
  } catch (error) {
    Logger.error('迁移失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default MigrationManager
