import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import path from 'path'
import fs from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const decodedFilename = decodeURIComponent(filename)
    
    // 构建文件路径
    const filePath = path.join(process.cwd(), 'scores', decodedFilename)
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { message: '文件不存在' },
        { status: 404 }
      )
    }
    
    // 读取文件
    const fileBuffer = fs.readFileSync(filePath)
    
    // 设置响应头
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    // 使用 encodeURIComponent 来正确编码中文文件名
    headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(decodedFilename)}`)
    headers.set('Cache-Control', 'public, max-age=31536000')
    // 允许在iframe中显示
    headers.set('X-Frame-Options', 'SAMEORIGIN')
    headers.set('Content-Security-Policy', "frame-ancestors 'self'")
    // 确保PDF能正确显示
    headers.set('Accept-Ranges', 'bytes')
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { message: '文件服务错误' },
      { status: 500 }
    )
  }
}