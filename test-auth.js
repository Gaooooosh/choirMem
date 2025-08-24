const fs = require('fs');
const path = require('path');

// 测试认证状态
async function testAuth() {
  try {
    // 首先测试 /api/users/me
    const meResponse = await fetch('http://localhost:3001/api/users/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('GET /api/users/me status:', meResponse.status);
    
    if (meResponse.ok) {
      const userData = await meResponse.json();
      console.log('User data:', userData);
    } else {
      console.log('User not authenticated');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAuth();