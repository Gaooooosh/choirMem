import payload from 'payload'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const resetUserPassword = async (email: string, newPassword: string) => {
  console.log(`🔧 正在为用户 ${email} 重置密码...`)

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

    // Update user password
    console.log('🔧 正在更新用户密码...')
    const updatedUser = await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password: newPassword,
        needs_password_reset: false,
      },
      overrideAccess: true,
    })

    console.log('✅ 密码重置成功!')
    console.log(`👤 用户: ${updatedUser.name || updatedUser.username}`)
    console.log(`📧 邮箱: ${updatedUser.email}`)
    console.log(`🔑 新密码: ${newPassword}`)
    console.log('')
    console.log('💡 用户现在可以使用新密码登录了!')

    process.exit(0)
  } catch (error) {
    console.error('❌ 重置密码时出错:', error)
    process.exit(1)
  }
}

// Get email and password from command line arguments
const email = process.argv[2]
const newPassword = process.argv[3] || 'admin123'

if (!email) {
  console.error('❌ 请提供用户邮箱地址')
  console.log('用法: pnpm tsx scripts/reset-user-password.ts <email> [password]')
  console.log('示例: pnpm tsx scripts/reset-user-password.ts user@example.com newpassword')
  process.exit(1)
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  console.error('❌ 请提供有效的邮箱地址格式')
  process.exit(1)
}

resetUserPassword(email, newPassword)