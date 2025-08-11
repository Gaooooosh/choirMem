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
 * 系统数据迁移脚本
 * 专门负责迁移系统设置和邀请码等系统数据
 */
export class SystemMigrator {
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

      Logger.info('系统迁移组件初始化完成')
    } catch (error) {
      Logger.error('初始化失败:', error)
      throw error
    }
  }

  /**
   * 验证前提条件
   */
  private async validatePreconditions(): Promise<boolean> {
    Logger.info('正在验证系统迁移前提条件...')

    // 检查旧数据库文件
    if (!fs.existsSync(this.oldDbPath)) {
      Logger.error(`旧数据库文件不存在: ${this.oldDbPath}`)
      return false
    }

    // 测试数据库连接
    try {
      await this.oldDataReader.waitForConnection()
      const invitationCodeCount = await this.oldDataReader.getInvitationCodeCount()
      const systemSettingCount = await this.oldDataReader.getSystemSettingCount()
      Logger.info(`旧系统中共有 ${invitationCodeCount} 个邀请码，${systemSettingCount} 个系统设置`)
    } catch (error) {
      Logger.error('无法连接到旧数据库:', error)
      return false
    }

    // 检查是否已有权限组数据（邀请码依赖权限组）
    const stats = this.idMapper.getStats()
    if (stats['permission-groups'] === 0) {
      Logger.warn('警告: 没有找到权限组ID映射，请先运行用户迁移脚本')
    }

    Logger.info('系统迁移前提条件验证通过')
    return true
  }

  /**
   * 执行系统迁移
   */
  async migrate(): Promise<void> {
    const startTime = Date.now()
    Logger.info('开始系统数据迁移...')

    try {
      // 初始化
      await this.initializePayload()
      
      // 验证前提条件
      if (!(await this.validatePreconditions())) {
        throw new Error('前提条件验证失败')
      }

      // 迁移邀请码
      Logger.info('迁移邀请码...')
      const oldCodes = await this.oldDataReader.getAllInvitationCodes()
      await this.dataTransformer.migrateInvitationCodes(oldCodes)

      // 迁移系统设置
      Logger.info('迁移系统设置...')
      const oldSettings = await this.oldDataReader.getAllSystemSettings()
      await this.dataTransformer.migrateSystemSettings(oldSettings)

      // 保存ID映射
      await this.saveIdMappings()
      
      // 验证迁移结果
      await this.validateMigration()

      const duration = (Date.now() - startTime) / 1000
      Logger.info(`系统迁移完成，总耗时: ${duration.toFixed(2)}秒`)

    } catch (error) {
      Logger.error('系统迁移失败:', error)
      throw error
    } finally {
      await this.cleanup()
    }
  }

  /**
   * 验证迁移结果
   */
  private async validateMigration(): Promise<void> {
    Logger.info('验证系统迁移结果...')

    try {
      // 验证邀请码
      const oldInvitationCodeCount = await this.oldDataReader.getInvitationCodeCount()
      const newInvitationCodeCount = await this.payload.count({
        collection: 'invitation-codes',
        overrideAccess: true,
      })
      Logger.info(`邀请码: 旧系统 ${oldInvitationCodeCount} 个，新系统 ${newInvitationCodeCount.totalDocs} 个`)

      // 验证系统设置
      const oldSystemSettingCount = await this.oldDataReader.getSystemSettingCount()
      const newSystemSettingCount = await this.payload.count({
        collection: 'system-settings',
        overrideAccess: true,
      })
      Logger.info(`系统设置: 旧系统 ${oldSystemSettingCount} 个，新系统 ${newSystemSettingCount.totalDocs} 个`)

      // 验证ID映射
      const stats = this.idMapper.getStats()
      Logger.info(`ID映射: 邀请码 ${stats['invitation-codes']} 个`)

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

  const migrator = new SystemMigrator(oldDbPath, mappingsPath)
  
  try {
    await migrator.migrate()
    Logger.info('系统迁移成功完成！')
    process.exit(0)
  } catch (error) {
    Logger.error('系统迁移失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default SystemMigrator