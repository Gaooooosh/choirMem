import { getPayload } from 'payload'
import { config as dotenvConfig } from 'dotenv'
import { OldDataReader } from './old-data-reader'
import { DataTransformer } from './data-transformer'
import { FileMigrator } from './file-migrator'
import { IdMapper } from './id-mapper'
import { Logger } from './utils'
import fs from 'fs'

// 确保环境变量被加载
dotenvConfig()

/**
 * 媒体文件迁移脚本
 * 专门负责迁移乐谱和照片等媒体文件
 */
export class MediaMigrator {
  private payload!: any
  private oldDataReader!: OldDataReader
  private idMapper!: IdMapper
  private fileMigrator!: FileMigrator
  private dataTransformer!: DataTransformer

  constructor(
    private oldDbPath: string = './数据迁移/app.db',
    private oldFilesPath: string = './数据迁移/temp_backup/uploads',
    private newFilesPath: string = './uploads',
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
      
      this.fileMigrator = new FileMigrator(this.oldFilesPath, this.newFilesPath)
      this.dataTransformer = new DataTransformer(this.idMapper, this.fileMigrator, this.payload)

      Logger.info('媒体迁移组件初始化完成')
    } catch (error) {
      Logger.error('初始化失败:', error)
      throw error
    }
  }

  /**
   * 验证前提条件
   */
  private async validatePreconditions(): Promise<boolean> {
    Logger.info('正在验证媒体迁移前提条件...')

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
      const scoreCount = await this.oldDataReader.getScoreCount()
      const photoCount = await this.oldDataReader.getPhotoCount()
      Logger.info(`旧系统中共有 ${scoreCount} 个乐谱，${photoCount} 张照片`)
    } catch (error) {
      Logger.error('无法连接到旧数据库:', error)
      return false
    }

    // 检查是否已有版本数据（媒体依赖版本）
    const stats = this.idMapper.getStats()
    if (stats['track-versions'] === 0) {
      Logger.warn('警告: 没有找到版本ID映射，请先运行曲目迁移脚本')
    }

    Logger.info('媒体迁移前提条件验证通过')
    return true
  }

  /**
   * 执行媒体迁移
   */
  async migrate(): Promise<void> {
    const startTime = Date.now()
    Logger.info('开始媒体数据迁移...')

    try {
      // 初始化
      await this.initializePayload()
      
      // 验证前提条件
      if (!(await this.validatePreconditions())) {
        throw new Error('前提条件验证失败')
      }

      // 迁移乐谱
      Logger.info('迁移乐谱...')
      const oldScores = await this.oldDataReader.getAllScores()
      await this.dataTransformer.migrateScores(oldScores)

      // 迁移照片/媒体
      Logger.info('迁移照片/媒体...')
      const oldPhotos = await this.oldDataReader.getAllPhotos()
      await this.dataTransformer.migratePhotosToMedia(oldPhotos)

      // 保存ID映射
      await this.saveIdMappings()
      
      // 验证迁移结果
      await this.validateMigration()

      const duration = (Date.now() - startTime) / 1000
      Logger.info(`媒体迁移完成，总耗时: ${duration.toFixed(2)}秒`)

    } catch (error) {
      Logger.error('媒体迁移失败:', error)
      throw error
    } finally {
      await this.cleanup()
    }
  }

  /**
   * 验证迁移结果
   */
  private async validateMigration(): Promise<void> {
    Logger.info('验证媒体迁移结果...')

    try {
      // 验证乐谱
      const oldScoreCount = await this.oldDataReader.getScoreCount()
      const newScoreCount = await this.payload.count({
        collection: 'scores',
        overrideAccess: true,
      })
      Logger.info(`乐谱: 旧系统 ${oldScoreCount} 个，新系统 ${newScoreCount.totalDocs} 个`)

      // 验证媒体
      const oldPhotoCount = await this.oldDataReader.getPhotoCount()
      const newMediaCount = await this.payload.count({
        collection: 'media',
        overrideAccess: true,
      })
      Logger.info(`媒体: 旧系统 ${oldPhotoCount} 张照片，新系统 ${newMediaCount.totalDocs} 个媒体文件`)

      // 验证ID映射
      const stats = this.idMapper.getStats()
      Logger.info(`ID映射: 乐谱 ${stats.scores} 个，媒体 ${stats.media} 个`)

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
  const oldFilesPath = args[1] || './数据迁移/temp_backup/uploads'
  const newFilesPath = args[2] || './uploads'
  const mappingsPath = args[3] || './id-mappings.json'

  const migrator = new MediaMigrator(oldDbPath, oldFilesPath, newFilesPath, mappingsPath)
  
  try {
    await migrator.migrate()
    Logger.info('媒体迁移成功完成！')
    process.exit(0)
  } catch (error) {
    Logger.error('媒体迁移失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default MediaMigrator