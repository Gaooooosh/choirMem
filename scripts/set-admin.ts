import payload from 'payload'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const setUserAsAdmin = async (email: string) => {
  console.log(`🔧 正在设置用户 ${email} 为管理员...`)

  try {
    console.log('🚀 正在初始化 Payload...')

    // Dynamically import the config
    const configPath = path.resolve(dirname, '../src/payload.config.ts')
    const { default: config } = await import(configPath)

    // Initialize Payload
    await payload.init({
      config,
    })

    console.log('🔍 正在查找用户...')

    // Find user by email
    const existingUser = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: email,
        },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (existingUser.docs.length === 0) {
      console.error(`❌ 未找到邮箱为 ${email} 的用户`)
      process.exit(1)
    }

    const user = existingUser.docs[0]
    console.log(`✅ 找到用户: ${user.name || user.username} (${user.email})`)

    // Check if admin permission group exists
    console.log('🔍 正在查找管理员权限组...')
    const adminGroup = await payload.find({
      collection: 'permission-groups',
      where: {
        name: {
          equals: 'Admin',
        },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (adminGroup.docs.length === 0) {
      console.error('❌ 未找到管理员权限组，请先运行 pnpm reset-db 创建基础数据')
      process.exit(1)
    }

    const adminGroupId = adminGroup.docs[0].id
    console.log(`✅ 找到管理员权限组: ${adminGroup.docs[0].name}`)

    // Update user to admin
    console.log('🔧 正在更新用户权限...')
    const updatedUser = await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        is_admin: true,
        group: adminGroupId,
      },
      overrideAccess: true,
    })

    console.log('✅ 用户权限更新成功!')
    console.log(`👤 用户: ${updatedUser.name || updatedUser.username}`)
    console.log(`📧 邮箱: ${updatedUser.email}`)
    console.log(`🔑 管理员状态: ${updatedUser.is_admin ? '是' : '否'}`)
    console.log(`👥 权限组: ${adminGroup.docs[0].name}`)
    console.log('')
    console.log('💡 用户现在拥有完整的管理员权限!')

    process.exit(0)
  } catch (error) {
    console.error('❌ 设置管理员时出错:', error)
    process.exit(1)
  }
}

// Get email from command line arguments
const email = process.argv[2]

if (!email) {
  console.error('❌ 请提供用户邮箱地址')
  console.log('用法: pnpm set-admin <email>')
  console.log('示例: pnpm set-admin user@example.com')
  process.exit(1)
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  console.error('❌ 请提供有效的邮箱地址格式')
  process.exit(1)
}

setUserAsAdmin(email)