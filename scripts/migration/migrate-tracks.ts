import { getPayload } from 'payload'
import { config as dotenvConfig } from 'dotenv'
import { OldDataReader } from './old-data-reader'
import { DataTransformer } from './data-transformer'
import { IdMapper } from './id-mapper'
import { Logger } from './utils'
import fs from 'fs'

// 确保环境变量被加载
dotenvConfig()

/**
 * 曲目和版本迁移脚本
 * 专门负责迁移曲目和曲目版本数据
 */
export class TrackMigrator {
  private payload!: any
  private oldDataReader!: OldDataReader
  private idMapper!: IdMapper
  private dataTransformer!: DataTransformer

  constructor(
    private oldDbPath: string = './数据迁移/app.db',
    private mappingsPath: string = './id-mappings.json'
  ) {}

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
      
      // 加载现有的ID映射（如果存在）
      if (fs.existsSync(this.mappingsPath)) {
        const mappings = JSON.parse(fs.readFileSync(this.mappingsPath, 'utf-8'))
        this.idMapper.importMappings(mappings)
        Logger.info('已加载现有ID映射')
      }
      
      this.dataTransformer = new DataTransformer(this.idMapper, null as any, this.payload)

      Logger.info('曲目迁移组件初始化完成')
    } catch (error) {
      Logger.error('初始化失败:', error)
      throw error
    }
  }

  /**
   * 验证前提条件
   */
  private async validatePreconditions(): Promise<boolean> {
    Logger.info('正在验证曲目迁移前提条件...')

    // 检查旧数据库文件
    if (!fs.existsSync(this.oldDbPath)) {
      Logger.error(`旧数据库文件不存在: ${this.oldDbPath}`)
      return false
    }

    // 测试数据库连接
    try {
      await this.oldDataReader.waitForConnection()
      const trackCount = await this.oldDataReader.getTrackCount()
      const versionCount = await this.oldDataReader.getTrackVersionCount()
      Logger.info(`旧系统中共有 ${trackCount} 个曲目，${versionCount} 个版本`)
    } catch (error) {
      Logger.error('无法连接到旧数据库:', error)
      return false
    }

    // 检查是否已有用户数据（曲目依赖用户）
    const userStats = this.idMapper.getStats()
    if (userStats.users === 0) {
      Logger.warn('警告: 没有找到用户ID映射，请先运行用户迁移脚本')
    }

    Logger.info('曲目迁移前提条件验证通过')
    return true
  }

  /**
   * 执行曲目迁移
   */
  async migrate(): Promise<void> {
    const startTime = Date.now()
    Logger.info('开始曲目数据迁移...')

    try {
      // 初始化
      await this.initializePayload()
      
      // 验证前提条件
      if (!(await this.validatePreconditions())) {
        throw new Error('前提条件验证失败')
      }

      // 迁移标签（版本依赖标签）
      Logger.info('迁移标签...')
      const oldTags = await this.oldDataReader.getAllTags()
      await this.dataTransformer.migrateTags(oldTags)
      
      // 迁移曲目
      Logger.info('迁移曲目...')
      const oldTracks = await this.oldDataReader.getAllTracks()
      await this.dataTransformer.migrateTracks(oldTracks)

      // 迁移曲目版本
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

      // 保存ID映射
      await this.saveIdMappings()
      
      // 验证迁移结果
      await this.validateMigration()

      const duration = (Date.now() - startTime) / 1000
      Logger.info(`曲目迁移完成，总耗时: ${duration.toFixed(2)}秒`)

    } catch (error) {
      Logger.error('曲目迁移失败:', error)
      throw error
    } finally {
      await this.cleanup()
    }
  }

  /**
   * 验证迁移结果
   */
  private async validateMigration(): Promise<void> {
    Logger.info('验证曲目迁移结果...')

    try {
      // 验证标签
      const oldTagCount = await this.oldDataReader.getTagCount()
      const newTagCount = await this.payload.count({
        collection: 'tags',
        overrideAccess: true,
      })
      Logger.info(`标签: 旧系统 ${oldTagCount} 个，新系统 ${newTagCount.totalDocs} 个`)

      // 验证曲目
      const oldTrackCount = await this.oldDataReader.getTrackCount()
      const newTrackCount = await this.payload.count({
        collection: 'tracks',
        overrideAccess: true,
      })
      Logger.info(`曲目: 旧系统 ${oldTrackCount} 个，新系统 ${newTrackCount.totalDocs} 个`)

      // 验证版本
      const oldVersionCount = await this.oldDataReader.getTrackVersionCount()
      const newVersionCount = await this.payload.count({
        collection: 'track-versions',
        overrideAccess: true,
      })
      Logger.info(`版本: 旧系统 ${oldVersionCount} 个，新系统 ${newVersionCount.totalDocs} 个`)

      // 验证ID映射
      const stats = this.idMapper.getStats()
      Logger.info(`ID映射: 标签 ${stats.tags} 个，曲目 ${stats.tracks} 个，版本 ${stats['track-versions']} 个`)

    } catch (error) {
      Logger.error('验证失败:', error)
      throw error
    }
  }

  /**
   * 保存ID映射
   */
  private async saveIdMappings(): Promise<void> {
    try {
      const mappings = this.idMapper.exportMappings()
      fs.writeFileSync(this.mappingsPath, JSON.stringify(mappings, null, 2))
      Logger.info(`ID映射已保存到: ${this.mappingsPath}`)
    } catch (error) {
      Logger.error('保存ID映射失败:', error)
      throw error
    }
  }

  /**
   * 清理资源
   */
  private async cleanup(): Promise<void> {
    try {
      if (this.oldDataReader) {
        await this.oldDataReader.close()
      }
      Logger.info('资源清理完成')
    } catch (error) {
      Logger.error('清理资源时出错:', error)
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  const oldDbPath = args[0] || './数据迁移/app.db'
  const mappingsPath = args[1] || './id-mappings.json'

  const migrator = new TrackMigrator(oldDbPath, mappingsPath)
  
  try {
    await migrator.migrate()
    Logger.info('曲目迁移成功完成！')
    process.exit(0)
  } catch (error) {
    Logger.error('曲目迁移失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default TrackMigrator