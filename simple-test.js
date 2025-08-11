console.log('脚本开始执行');

try {
  console.log('尝试导入 payload...');
  import('payload').then((payload) => {
    console.log('payload 导入成功:', Object.keys(payload));
  }).catch((err) => {
    console.error('payload 导入失败:', err.message);
  });
} catch (err) {
  console.error('同步错误:', err.message);
}

console.log('脚本执行完成');