import fs from 'fs'
import path from 'path'

// 创建简单的SVG测试图片
const createSVG = () => {
  const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="#ff6b6b"/>
  <text x="100" y="100" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="16">SVG Test</text>
</svg>`
  fs.writeFileSync('test-image.svg', svg)
  console.log('✅ 创建 SVG 测试图片')
}

// 创建简单的HTML文件用于测试
const createTestHTML = () => {
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>图片格式测试</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .upload-area { border: 2px dashed #ccc; padding: 20px; text-align: center; margin: 10px 0; }
        .result { margin: 10px 0; padding: 10px; background: #f5f5f5; }
    </style>
</head>
<body>
    <h1>图片上传格式兼容性测试</h1>
    
    <div class="test-section">
        <h2>支持的格式</h2>
        <ul>
            <li>JPEG (.jpg, .jpeg)</li>
            <li>PNG (.png)</li>
            <li>GIF (.gif)</li>
            <li>WebP (.webp)</li>
            <li>SVG (.svg)</li>
        </ul>
    </div>
    
    <div class="test-section">
        <h2>测试步骤</h2>
        <ol>
            <li>访问 <a href="http://localhost:3000/test-image-upload" target="_blank">图片上传测试页面</a></li>
            <li>分别测试上传不同格式的图片</li>
            <li>检查上传状态和错误处理</li>
            <li>验证图片在编辑器中的显示效果</li>
        </ol>
    </div>
    
    <div class="test-section">
        <h2>测试文件</h2>
        <p>在当前目录中已创建以下测试文件：</p>
        <ul>
            <li>test-image.svg - SVG 格式测试图片</li>
        </ul>
        <p>你可以从网上下载其他格式的测试图片，或使用现有的图片文件。</p>
    </div>
    
    <div class="test-section">
        <h2>预期结果</h2>
        <ul>
            <li>✅ 所有支持的格式都能成功上传</li>
            <li>✅ 上传过程有进度显示</li>
            <li>✅ 图片能在编辑器中正确显示</li>
            <li>✅ 错误格式会显示明确的错误信息</li>
            <li>✅ 文件大小超限会被拒绝</li>
        </ul>
    </div>
</body>
</html>`
  fs.writeFileSync('test-guide.html', html)
  console.log('✅ 创建测试指南 HTML 文件')
}

// 运行创建函数
console.log('🔧 创建测试文件...')
createSVG()
createTestHTML()
console.log('\n📋 测试文件创建完成！')
console.log('📖 打开 test-guide.html 查看测试指南')
console.log('🌐 访问 http://localhost:3000/test-image-upload 进行测试')