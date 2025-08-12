import { Logger } from './utils'
import UserMigrator from './migrate-users'
import TrackMigrator from './migrate-tracks'
import MediaMigrator from './migrate-media'
import ContentMigrator from './migrate-content'
import SystemMigrator from './migrate-system'

/**
 * 分步迁移控制脚本
 * 允许用户选择性地运行不同的迁移步骤
 */

const MIGRATION_STEPS = {
  users: {
    name: '用户和权限组',
    description: '迁移用户账户和权限组数据',
    migrator: UserMigrator,
    dependencies: []
  },
  tracks: {
    name: '曲目和版本',
    description: '迁移曲目、版本和标签数据',
    migrator: TrackMigrator,
    dependencies: ['users']
  },
  media: {
    name: '媒体文件',
    description: '迁移乐谱和照片等媒体文件',
    migrator: MediaMigrator,
    dependencies: ['users', 'tracks']
  },
  content: {
    name: '内容数据',
    description: '迁移评论和文章数据',
    migrator: ContentMigrator,
    dependencies: ['users', 'tracks']
  },
  system: {
    name: '系统设置',
    description: '迁移邀请码和系统设置',
    migrator: SystemMigrator,
    dependencies: ['users']
  }
}

function printUsage() {
  console.log('\n数据迁移分步执行工具')
  console.log('========================\n')
  console.log('用法: pnpm migrate:step <步骤名称> [参数...]\n')
  console.log('可用步骤:')
  
  Object.entries(MIGRATION_STEPS).forEach(([key, step]) => {
    console.log(`  ${key.padEnd(10)} - ${step.name}`)
    console.log(`  ${' '.repeat(13)} ${step.description}`)
    if (step.dependencies.length > 0) {
      console.log(`  ${' '.repeat(13)} 依赖: ${step.dependencies.join(', ')}`)
    }
    console.log()
  })
  
  console.log('参数:')
  console.log('  [旧数据库路径]   默认: ./数据迁移/app.db')
  console.log('  [旧文件路径]     默认: ./数据迁移/temp_backup/uploads (仅媒体迁移需要)')
  console.log('  [新文件路径]     默认: ./uploads (仅媒体迁移需要)')
  console.log('  [映射文件路径]   默认: ./id-mappings.json\n')
  
  console.log('示例:')
  console.log('  pnpm migrate:step users')
  console.log('  pnpm migrate:step tracks ./数据迁移/app.db')
  console.log('  pnpm migrate:step media ./数据迁移/app.db ./数据迁移/temp_backup/uploads ./uploads')
  console.log('  pnpm migrate:step all  # 按顺序执行所有步骤\n')
}

async function runMigrationStep(stepName: string, args: string[]) {
  if (stepName === 'all') {
    return await runAllSteps(args)
  }
  
  const step = MIGRATION_STEPS[stepName as keyof typeof MIGRATION_STEPS]
  if (!step) {
    Logger.error(`未知的迁移步骤: ${stepName}`)
    printUsage()
    process.exit(1)
  }
  
  Logger.info(`开始执行迁移步骤: ${step.name}`)
  Logger.info(`描述: ${step.description}`)
  
  if (step.dependencies.length > 0) {
    Logger.info(`依赖步骤: ${step.dependencies.join(', ')}`)
    Logger.info('请确保已先执行依赖步骤')
  }
  
  try {
    let migrator
    
    if (stepName === 'media') {
      // 媒体迁移需要额外的文件路径参数
      const oldDbPath = args[0] || './数据迁移/app.db'
      const oldFilesPath = args[1] || './数据迁移/temp_backup/uploads'
      const newFilesPath = args[2] || './uploads'
      const mappingsPath = args[3] || './id-mappings.json'
      migrator = new step.migrator(oldDbPath, oldFilesPath, newFilesPath, mappingsPath)
    } else {
      // 其他迁移只需要数据库路径和映射文件路径
      const oldDbPath = args[0] || './数据迁移/app.db'
      const mappingsPath = args[1] || './id-mappings.json'
      migrator = new step.migrator(oldDbPath, mappingsPath)
    }
    
    await migrator.migrate()
    Logger.info(`✅ 迁移步骤 "${step.name}" 执行成功！`)
    
  } catch (error) {
    Logger.error(`❌ 迁移步骤 "${step.name}" 执行失败:`, error)
    process.exit(1)
  }
}

async function runAllSteps(args: string[]) {
  Logger.info('开始执行完整迁移流程...')
  
  const stepOrder = ['users', 'tracks', 'media', 'content', 'system']
  
  for (const stepName of stepOrder) {
    Logger.info(`\n${'='.repeat(50)}`)
    Logger.info(`执行步骤: ${stepName}`)
    Logger.info(`${'='.repeat(50)}`)
    
    try {
      await runMigrationStep(stepName, args)
      Logger.info(`✅ 步骤 "${stepName}" 完成`)
    } catch (error) {
      Logger.error(`❌ 步骤 "${stepName}" 失败，停止后续迁移`)
      throw error
    }
  }
  
  Logger.info('\n🎉 所有迁移步骤执行完成！')
}

// 主函数
async function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    printUsage()
    process.exit(1)
  }
  
  const stepName = args[0]
  const migrationArgs = args.slice(1)
  
  if (stepName === 'help' || stepName === '--help' || stepName === '-h') {
    printUsage()
    process.exit(0)
  }
  
  try {
    await runMigrationStep(stepName, migrationArgs)
    process.exit(0)
  } catch (error) {
    Logger.error('迁移执行失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { runMigrationStep, runAllSteps }