import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// 健康检查端点
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // 基本信息
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: false,
        filesystem: false,
        memory: false
      },
      metrics: {
        responseTime: 0,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    }

    // 数据库文件检查（简化版，不实际连接数据库）
    try {
      const dbPath = process.env.DATABASE_URI?.replace('file:', '') || './data.db'
      const resolvedPath = path.resolve(dbPath)
      
      // 检查数据库文件是否存在
      if (fs.existsSync(resolvedPath)) {
        // 检查文件是否可读写
        fs.accessSync(resolvedPath, fs.constants.R_OK | fs.constants.W_OK)
        healthData.checks.database = true
      } else {
        // 在开发环境中，数据库文件可能还不存在，这是正常的
        healthData.checks.database = process.env.NODE_ENV === 'development'
      }
    } catch (error) {
      console.error('Database file check failed:', error)
      healthData.checks.database = false
    }

    // 文件系统检查
    try {
      // 检查项目根目录是否可访问
      const projectRoot = process.cwd()
      fs.accessSync(projectRoot, fs.constants.R_OK | fs.constants.W_OK)
      healthData.checks.filesystem = true
    } catch (error) {
      console.error('Filesystem health check failed:', error)
      healthData.checks.filesystem = false
    }

    // 内存使用检查
    const memUsage = process.memoryUsage()
    const maxMemory = 1024 * 1024 * 1024 // 1GB
    healthData.checks.memory = memUsage.heapUsed < maxMemory

    // 计算响应时间
    healthData.metrics.responseTime = Date.now() - startTime

    // 确定整体健康状态
    const allChecksPass = Object.values(healthData.checks).every(check => check === true)
    healthData.status = allChecksPass ? 'healthy' : 'degraded'

    // 返回适当的HTTP状态码
    const statusCode = allChecksPass ? 200 : 200 // 即使有问题也返回200，但状态为degraded

    return NextResponse.json(healthData, { status: statusCode })
    
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        database: false,
        filesystem: false,
        memory: false
      }
    }, { status: 500 })
  }
}

// 支持HEAD请求用于简单的存活检查
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}