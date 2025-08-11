import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

import { getPayload } from 'payload';

async function testCollections() {
  try {
    console.log('开始测试 Payload 集合...');
    
    // 动态导入配置文件
    const configModule = await import('./src/payload.config');
    const config = configModule.default;
    
    console.log('配置文件导入成功');
    console.log('配置中的集合:', config.collections?.map(c => c.slug || c.name));
    
    const payload = await getPayload({ config });
    console.log('Payload 初始化成功');
    
    // 列出所有可用的集合
    const collections = Object.keys(payload.collections);
    console.log('可用的集合:', collections);
    
    // 检查 permission-groups 集合是否存在
    if (payload.collections['permission-groups']) {
      console.log('✅ permission-groups 集合存在');
    } else {
      console.log('❌ permission-groups 集合不存在');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

testCollections();