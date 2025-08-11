import { config as dotenvConfig } from 'dotenv';
import { getPayload } from 'payload';

// 加载环境变量
dotenvConfig();

async function testPermissionGroupCreation() {
  try {
    console.log('正在初始化 Payload...');
    
    // 动态导入配置文件
    const config = await import('./src/payload.config');
    
    // 初始化 Payload
    const payload = await getPayload({ config: config.default });
    
    console.log('Payload 初始化成功');
    
    // 尝试创建权限组
    console.log('尝试创建权限组...');
    
    const newGroup = await payload.create({
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
        can_manage_invitation_codes: false
      },
      // 跳过访问控制
      overrideAccess: true
    });
    
    console.log('权限组创建成功:', newGroup);
    
    // 删除测试权限组
    await payload.delete({
      collection: 'permission-groups',
      id: newGroup.id,
      overrideAccess: true
    });
    
    console.log('测试权限组已删除');
    
  } catch (error) {
    console.error('测试失败:', error);
    if (error.data && error.data.errors) {
      console.error('验证错误:', error.data.errors);
    }
  } finally {
    process.exit(0);
  }
}

testPermissionGroupCreation();