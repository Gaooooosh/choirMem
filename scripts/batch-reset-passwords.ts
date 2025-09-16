import payload from 'payload'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const batchResetPasswords = async (newPassword: string) => {
  console.log(`🔧 正在批量重置需要重置密码的用户密码...`)

  try {
    console.log('🚀 正在初始化 Payload...')

    // Dynamically import the config
    const configPath = path.resolve(dirname, '../src/payload.config.ts')
    const { default: config } = await import(configPath)

    // Initialize Payload
    await payload.init({
      config,
    })

    console.log('🔍 正在查找需要重置密码的用户...')

    // Find all users that need password reset
    const usersNeedingReset = await payload.find({
      collection: 'users',
      where: {
        needs_password_reset: {
          equals: true,
        },
      },
      limit: 1000,
      overrideAccess: true,
    })

    if (usersNeedingReset.docs.length === 0) {
      console.log('✅ 没有找到需要重置密码的用户')
      process.exit(0)
    }

    console.log(`📋 找到 ${usersNeedingReset.docs.length} 个需要重置密码的用户`)

    let successCount = 0
    let errorCount = 0

    // Reset password for each user
    for (const user of usersNeedingReset.docs) {
      try {
        console.log(`🔧 正在重置用户密码: ${user.username} (${user.email})`)
        
        await payload.update({
          collection: 'users',
          id: user.id,
          data: {
            password: newPassword,
            needs_password_reset: false,
          },
          overrideAccess: true,
        })

        console.log(`✅ 成功重置: ${user.username} (${user.email})`)
        successCount++
      } catch (error) {
        console.error(`❌ 重置失败: ${user.username} (${user.email}) - ${error}`)
        errorCount++
      }
    }

    console.log('')
    console.log('📊 批量重置密码完成!')
    console.log(`✅ 成功: ${successCount} 个用户`)
    console.log(`❌ 失败: ${errorCount} 个用户`)
    console.log(`🔑 新密码: ${newPassword}`)
    console.log('')
    console.log('💡 所有用户现在可以使用新密码登录了!')

    process.exit(0)
  } catch (error) {
    console.error('❌ 批量重置密码时出错:', error)
    process.exit(1)
  }
}

// Get password from command line arguments
const newPassword = process.argv[2]

if (!newPassword) {
  console.error('❌ 请提供新密码')
  console.log('用法: pnpm tsx scripts/batch-reset-passwords.ts <新密码>')
  console.log('示例: pnpm tsx scripts/batch-reset-passwords.ts newpassword123')
  process.exit(1)
}

if (newPassword.length < 6) {
  console.error('❌ 密码长度至少需要6位')
  process.exit(1)
}

batchResetPasswords(newPassword)