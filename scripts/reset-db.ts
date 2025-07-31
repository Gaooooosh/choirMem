import { promises as fs } from 'fs'
import payload from 'payload'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { seedData } from './seed-data'

// Load environment variables
dotenv.config()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const resetDatabase = async () => {
  console.log('🗑️  正在重置数据库...')

  try {
    // Delete database files
    const dbFiles = ['data.db', 'data.db-shm', 'data.db-wal']

    for (const file of dbFiles) {
      try {
        await fs.unlink(file)
        console.log(`✅ 已删除 ${file}`)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.log(`⚠️  删除 ${file} 时出错:`, error)
        }
      }
    }

    console.log('🚀 正在初始化 Payload...')

    // Dynamically import the config
    const configPath = path.resolve(dirname, '../src/payload.config.ts')
    const { default: config } = await import(configPath)

    // Initialize Payload
    await payload.init({
      config,
    })

    console.log('🔐 正在创建管理员权限组...')

    // Create admin permission group
    const adminGroup = await payload.create({
      collection: 'permission-groups',
      data: {
        name: 'Admin',
        can_view_scores: true,
        can_upload_scores: true,
        can_upload_photos: true,
        can_post_comments: true,
        can_create_tracks: true,
        can_manage_permission_groups: true,
      },
    })

    console.log('👤 正在创建管理员用户...')

    // Create admin user
    const adminUser = await payload.create({
      collection: 'users',
      data: {
        email: 'admin@example.com',
        password: 'admin123',
        name: '管理员',
        username: 'admin',
        group: adminGroup.id,
        activity_score: 0,
        is_admin: true,
      },
    })

    // Create seed data
    await seedData(payload, String(adminUser.id))

    console.log('✅ 数据库重置完成!')
    console.log('📧 管理员邮箱: admin@example.com')
    console.log('🔑 管理员密码: admin123')
    console.log('👤 用户名: admin')
    console.log('')
    console.log('💡 请记得在生产环境中更改默认密码!')

    process.exit(0)
  } catch (error) {
    console.error('❌ 重置数据库时出错:', error)
    process.exit(1)
  }
}

resetDatabase()
