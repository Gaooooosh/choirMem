import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 测试图片路径解析和显示逻辑
async function testImageUpload() {
  try {
    console.log('🔍 测试图片上传和路径解析...')
    
    // 检查媒体目录是否存在
    const mediaDir = path.join(__dirname, 'public', 'media')
    console.log('📁 媒体目录:', mediaDir)
    console.log('📁 目录存在:', fs.existsSync(mediaDir))
    
    if (fs.existsSync(mediaDir)) {
      const files = fs.readdirSync(mediaDir)
      console.log('📄 现有文件:', files.slice(0, 5)) // 只显示前5个文件
    }
    
    // 测试API端点
    console.log('\n🌐 测试API端点...')
    const response = await fetch('http://localhost:3000/api/media?limit=1')
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API响应正常')
      
      if (data.docs && data.docs.length > 0) {
        const media = data.docs[0]
        console.log('📸 示例媒体记录:')
        console.log('  - ID:', media.id)
        console.log('  - 文件名:', media.filename)
        console.log('  - URL:', media.url)
        console.log('  - MIME类型:', media.mimeType)
        console.log('  - 大小:', media.filesize, 'bytes')
        
        // 测试图片URL是否可访问
        if (media.url) {
          const imageUrl = media.url.startsWith('http') ? media.url : `http://localhost:3000${media.url}`
          console.log('\n🔗 测试图片URL访问:', imageUrl)
          
          try {
            const imgResponse = await fetch(imageUrl)
            console.log('  - 状态码:', imgResponse.status)
            console.log('  - Content-Type:', imgResponse.headers.get('content-type'))
            console.log('  - 可访问:', imgResponse.ok ? '✅' : '❌')
          } catch (error) {
            console.log('  - 访问失败:', error.message)
          }
        }
      } else {
        console.log('📭 暂无媒体记录')
      }
    } else {
      console.log('❌ API响应失败:', response.status)
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
  }
}

// 运行测试
testImageUpload()