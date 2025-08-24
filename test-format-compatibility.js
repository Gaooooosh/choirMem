import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 测试不同图片格式的兼容性
async function testImageFormats() {
  console.log('🧪 测试图片格式兼容性...')
  
  const testResults = {
    supported: [],
    unsupported: [],
    errors: []
  }
  
  // 支持的格式列表
  const supportedFormats = [
    { ext: 'jpg', mime: 'image/jpeg' },
    { ext: 'jpeg', mime: 'image/jpeg' },
    { ext: 'png', mime: 'image/png' },
    { ext: 'gif', mime: 'image/gif' },
    { ext: 'webp', mime: 'image/webp' },
    { ext: 'svg', mime: 'image/svg+xml' }
  ]
  
  // 不支持的格式列表
  const unsupportedFormats = [
    { ext: 'bmp', mime: 'image/bmp' },
    { ext: 'tiff', mime: 'image/tiff' },
    { ext: 'ico', mime: 'image/x-icon' },
    { ext: 'pdf', mime: 'application/pdf' },
    { ext: 'txt', mime: 'text/plain' }
  ]
  
  console.log('\n📋 支持的格式测试:')
  for (const format of supportedFormats) {
    try {
      // 模拟文件上传验证
      const isImageType = format.mime.startsWith('image/')
      const isInMimeList = [
        'image/jpeg',
        'image/png',
        'image/gif', 
        'image/webp',
        'image/svg+xml'
      ].includes(format.mime)
      
      if (isImageType && isInMimeList) {
        console.log(`  ✅ ${format.ext.toUpperCase()} (${format.mime}) - 支持`)
        testResults.supported.push(format)
      } else {
        console.log(`  ❌ ${format.ext.toUpperCase()} (${format.mime}) - 不支持`)
        testResults.unsupported.push(format)
      }
    } catch (error) {
      console.log(`  ⚠️  ${format.ext.toUpperCase()} - 测试错误: ${error.message}`)
      testResults.errors.push({ format, error: error.message })
    }
  }
  
  console.log('\n📋 不支持的格式测试:')
  for (const format of unsupportedFormats) {
    try {
      const isImageType = format.mime.startsWith('image/')
      const isInMimeList = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
      ].includes(format.mime)
      
      if (!isImageType || !isInMimeList) {
        console.log(`  ✅ ${format.ext.toUpperCase()} (${format.mime}) - 正确拒绝`)
      } else {
        console.log(`  ❌ ${format.ext.toUpperCase()} (${format.mime}) - 意外支持`)
        testResults.errors.push({ format, error: '意外支持了不应该支持的格式' })
      }
    } catch (error) {
      console.log(`  ⚠️  ${format.ext.toUpperCase()} - 测试错误: ${error.message}`)
      testResults.errors.push({ format, error: error.message })
    }
  }
  
  // 测试文件大小限制
  console.log('\n📏 文件大小限制测试:')
  const maxSize = 10 * 1024 * 1024 // 10MB
  const testSizes = [
    { size: 1024, name: '1KB', shouldPass: true },
    { size: 1024 * 1024, name: '1MB', shouldPass: true },
    { size: 5 * 1024 * 1024, name: '5MB', shouldPass: true },
    { size: 10 * 1024 * 1024, name: '10MB', shouldPass: true },
    { size: 15 * 1024 * 1024, name: '15MB', shouldPass: false },
    { size: 50 * 1024 * 1024, name: '50MB', shouldPass: false }
  ]
  
  for (const test of testSizes) {
    const passes = test.size <= maxSize
    const result = passes === test.shouldPass ? '✅' : '❌'
    const status = passes ? '通过' : '拒绝'
    console.log(`  ${result} ${test.name} - ${status} (预期: ${test.shouldPass ? '通过' : '拒绝'})`)
  }
  
  // 输出测试总结
  console.log('\n📊 测试总结:')
  console.log(`  ✅ 支持的格式: ${testResults.supported.length}个`)
  console.log(`  ❌ 不支持的格式: ${testResults.unsupported.length}个`)
  console.log(`  ⚠️  错误: ${testResults.errors.length}个`)
  
  if (testResults.errors.length > 0) {
    console.log('\n⚠️  错误详情:')
    testResults.errors.forEach(({ format, error }) => {
      console.log(`    - ${format.ext}: ${error}`)
    })
  }
  
  console.log('\n🎯 建议测试步骤:')
  console.log('  1. 访问 http://localhost:3000/test-image-upload')
  console.log('  2. 测试上传 test-images/test-image.svg')
  console.log('  3. 测试上传不同格式的图片文件')
  console.log('  4. 测试上传超大文件（>10MB）')
  console.log('  5. 测试上传非图片文件')
  console.log('  6. 验证错误提示是否清晰明确')
  
  return testResults
}

// 运行测试
testImageFormats().catch(console.error)