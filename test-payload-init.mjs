import { getPayload } from 'payload'
import { config as dotenvConfig } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载环境变量
dotenvConfig()

async function testPayloadInit() {
  try {
    console.log('开始测试Payload初始化...')
    console.log('DATABASE_URI:', process.env.DATABASE_URI)
    console.log('PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? '已设置' : '未设置')

    // 动态导入配置文件
    const configModule = await import('./src/payload.config.ts')
    const config = configModule.default

    console.log('配置加载成功')
    console.log('配置中的secret:', config.secret ? '已设置' : '未设置')

    const payload = await getPayload({ config })

    console.log('Payload初始化成功')

    // 测试创建权限组
    const testGroup = await payload.create({
      collection: 'permission-groups',
      data: {
        name: '测试权限组',
        can_view_scores: true,
        can_upload_scores: false,
        can_upload_photos: false,
        can_post_comments: false,
        can_create_tracks: false,
        can_manage_permission_groups: false,
        can_manage_system_settings: false,
        can_manage_users: false,
        can_manage_invitation_codes: false,
      },
      overrideAccess: true,
    })

    console.log('权限组创建成功:', testGroup.id)

    // 清理测试数据
    await payload.delete({
      collection: 'permission-groups',
      id: testGroup.id,
      overrideAccess: true,
    })

    console.log('测试完成，权限组创建和删除都正常')
  } catch (error) {
    console.error('测试失败:', error)
    if (error.data && error.data.errors) {
      console.error('详细错误:', JSON.stringify(error.data.errors, null, 2))
    }
  }
}

testPayloadInit()
