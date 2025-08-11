import { config as dotenvConfig } from 'dotenv';

// 先加载环境变量
dotenvConfig();
console.log('PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? '已设置' : '未设置');
console.log('DATABASE_URI:', process.env.DATABASE_URI);

// 然后导入其他模块
import { getPayload } from 'payload';
import config from './src/payload.config.ts';

async function testPayload() {
  console.log('开始测试...');
  try {
    console.log('正在初始化 Payload...');
    console.log('配置中的secret:', config.secret);
    
    // 直接传入secret参数
    const payload = await getPayload({ 
      config: {
        ...config,
        secret: process.env.PAYLOAD_SECRET
      }
    });
    console.log('Payload 初始化成功!');
    console.log('Collections:', Object.keys(payload.collections));
    return payload;
  } catch (error) {
    console.error('Payload 初始化失败:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

console.log('脚本开始执行');
testPayload().then((payload) => {
  console.log('异步函数执行完成');
  process.exit(0);
}).catch((err) => {
  console.error('异步函数执行失败:', err);
  process.exit(1);
});