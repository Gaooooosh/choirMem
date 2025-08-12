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
 * 内容迁移脚本
 * 专门负责迁移评论和文章等内容数据
 */
export class ContentMigrator {
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

      Logger.info('内容迁移组件初始化完成')
    } catch (error) {
      Logger.error('初始化失败:', error)
      throw error
    }
  }

  /**
   * 验证前提条件
   */
  private async validatePreconditions(): Promise<boolean> {
    Logger.info('正在验证内容迁移前提条件...')

    // 检查旧数据库文件
    if (!fs.existsSync(this.oldDbPath)) {
      Logger.error(`旧数据库文件不存在: ${this.oldDbPath}`)
      return false
    }

    // 测试数据库连接
    try {
      await this.oldDataReader.waitForConnection()
      const commentCount = await this.oldDataReader.getCommentCount()
      const articleCount = await this.oldDataReader.getArticleCount()
      Logger.info(`旧系统中共有 ${commentCount} 条评论，${articleCount} 篇文章`)
    } catch (error) {
      Logger.error('无法连接到旧数据库:', error)
      return false
    }

    // 检查是否已有依赖数据
    const stats = this.idMapper.getStats()
    if (stats.users === 0) {
      Logger.warn('警告: 没有找到用户ID映射，请先运行用户迁移脚本')
    }
    if (stats.tracks === 0) {
      Logger.warn('警告: 没有找到曲目ID映射，请先运行曲目迁移脚本')
    }
    if (stats.tags === 0) {
      Logger.warn('警告: 没有找到标签ID映射，文章迁移可能受影响')
    }

    Logger.info('内容迁移前提条件验证通过')
    return true
  }

  /**
   * 执行内容迁移
   */
  async migrate(): Promise<void> {
    const startTime = Date.now()
    Logger.info('开始内容数据迁移...')

    try {
      // 初始化
      await this.initializePayload()
      
      // 验证前提条件
      if (!(await this.validatePreconditions())) {
        throw new Error('前提条件验证失败')
      }

      // 迁移评论
      Logger.info('迁移评论...')
      const oldComments = await this.oldDataReader.getAllComments()
      await this.dataTransformer.migrateComments(oldComments)

      // 迁移文章
      Logger.info('迁移文章...')
      const oldArticles = await this.oldDataReader.getAllArticles()
      await this.dataTransformer.migrateArticles(oldArticles)

      // 保存ID映射
      await this.saveIdMappings()
      
      // 验证迁移结果
      await this.validateMigration()

      const duration = (Date.now() - startTime) / 1000
      Logger.info(`内容迁移完成，总耗时: ${duration.toFixed(2)}秒`)

    } catch (error) {
      Logger.error('内容迁移失败:', error)
      throw error
    } finally {
      await this.cleanup()
    }
  }

  /**
   * 验证迁移结果
   */
  private async validateMigration(): Promise<void> {
    Logger.info('验证内容迁移结果...')

    try {
      // 验证评论
      const oldCommentCount = await this.oldDataReader.getCommentCount()
      const newCommentCount = await this.payload.count({
        collection: 'comments',
        overrideAccess: true,
      })
      Logger.info(`评论: 旧系统 ${oldCommentCount} 条，新系统 ${newCommentCount.totalDocs} 条`)

      // 验证文章
      const oldArticleCount = await this.oldDataReader.getArticleCount()
      const newArticleCount = await this.payload.count({
        collection: 'articles',
        overrideAccess: true,
      })
      Logger.info(`文章: 旧系统 ${oldArticleCount} 篇，新系统 ${newArticleCount.totalDocs} 篇`)

      // 验证ID映射
      const stats = this.idMapper.getStats()
      Logger.info(`ID映射: 评论 ${stats.comments} 条，文章 ${stats.articles} 篇`)

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

  const migrator = new ContentMigrator(oldDbPath, mappingsPath)
  
  try {
    await migrator.migrate()
    Logger.info('内容迁移成功完成！')
    process.exit(0)
  } catch (error) {
    Logger.error('内容迁移失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default ContentMigrator