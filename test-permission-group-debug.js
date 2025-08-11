import { config as dotenvConfig } from 'dotenv'
import { getPayload } from 'payload'

// 加载环境变量
dotenvConfig()

async function testPermissionGroupCreation() {
  try {
    console.log('正在初始化 Payload...')

    // 动态导入配置文件
    const config = await import('./src/payload.config.ts')

    // 初始化 Payload
    const payload = await getPayload({ config: config.default })

    console.log('Payload 初始化成功')

    // 测试不同的权限组名称
    const testNames = [
      '在团团员',
      '离团团友',
      '高级贡献团友',
      '在校团友',
      '指导老师',
      'test-group',
      'TestGroup',
      '测试',
    ]

    for (const name of testNames) {
      try {
        console.log(`\n尝试创建权限组: ${name}`)

        const newGroup = await payload.create({
          collection: 'permission-groups',
          data: {
            name: name,
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

        console.log(`✓ 权限组创建成功: ${name} -> ID: ${newGroup.id}`)

        // 删除测试权限组
        await payload.delete({
          collection: 'permission-groups',
          id: newGroup.id,
          overrideAccess: true,
        })

        console.log(`✓ 测试权限组已删除: ${name}`)
      } catch (error) {
        console.error(`✗ 权限组创建失败: ${name}`)
        console.error('错误详情:', error.message)
        if (error.data && error.data.errors) {
          console.error('验证错误:', JSON.stringify(error.data.errors, null, 2))
        }
      }
    }
  } catch (error) {
    console.error('测试失败:', error)
  } finally {
    process.exit(0)
  }
}

testPermissionGroupCreation()
