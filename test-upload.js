// 测试图片上传API
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testImageUpload() {
  try {
    // 创建一个简单的测试图片文件
    const testImageContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#4F46E5"/>
      <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="12">Test</text>
    </svg>`;
    
    fs.writeFileSync('/tmp/test-image.svg', testImageContent);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream('/tmp/test-image.svg'));
    formData.append('alt', 'test-image.svg');
    
    console.log('正在上传测试图片...');
    
    const response = await fetch('http://localhost:3001/api/media', {
      method: 'POST',
      body: formData,
      headers: {
        // 这里可能需要添加认证头
      }
    });
    
    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('响应内容:', responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('解析后的数据:', JSON.stringify(data, null, 2));
      
      // 检查图片URL
      const imageUrl = data.doc.url || `/media/${data.doc.filename}`;
      console.log('图片URL:', imageUrl);
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

testImageUpload();