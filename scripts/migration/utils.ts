import fs from 'fs'
import path from 'path'

// 将纯文本转换为 Lexical 富文本格式
export function convertToLexicalRichText(plainText: string | null | undefined): any {
  if (!plainText || plainText.trim() === '') {
    return {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [],
            direction: 'ltr',
          },
        ],
        direction: 'ltr',
      },
    }
  }

  // 按行分割文本
  const lines = plainText.split('\n')
  const children = lines.map((line) => ({
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children:
      line.trim() === ''
        ? []
        : [
            {
              type: 'text',
              format: 0,
              style: '',
              mode: 'normal',
              text: line,
              version: 1,
            },
          ],
    direction: 'ltr',
  }))

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr',
    },
  }
}

// 生成占位邮箱
export function generatePlaceholderEmail(username: string): string {
  // 将用户名转换为安全的邮箱格式
  // 移除特殊字符，将中文字符转换为拼音或使用安全字符
  const safeUsername = username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // 只保留字母和数字
    .substring(0, 20) // 限制长度

  // 如果处理后为空，使用默认前缀
  const finalUsername = safeUsername || 'user'

  // 生成符合标准的邮箱格式，使用 example.com 域名
  return `${finalUsername}@example.com`
}

// 检查文件是否存在
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath)
  } catch {
    return false
  }
}

// 确保目录存在
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// 复制文件
export function copyFile(source: string, destination: string): void {
  ensureDirectoryExists(path.dirname(destination))
  fs.copyFileSync(source, destination)
}

// 获取文件扩展名
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase()
}

// 检查是否为图片文件
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
  return imageExtensions.includes(getFileExtension(filename))
}

// 检查是否为PDF文件
export function isPdfFile(filename: string): boolean {
  const ext = getFileExtension(filename)
  return ext === '.pdf' || filename.endsWith('_pdf')
}

// 生成slug
export function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\u4e00-\u9fff-]/g, '') // 保留中文字符、英文字符、数字、空格和连字符
      .replace(/[\s_-]+/g, '-') // 将空格和下划线转换为连字符
      .replace(/^-+|-+$/g, '') || // 移除开头和结尾的连字符
    'untitled'
  ) // 如果结果为空，使用默认值
}

// 格式化时间戳
export function formatTimestamp(timestamp: string): string {
  // 如果已经是ISO格式，直接返回
  if (timestamp.includes('T') && timestamp.includes('Z')) {
    return timestamp
  }

  // 尝试解析并转换为ISO格式
  try {
    const date = new Date(timestamp)
    return date.toISOString()
  } catch {
    // 如果解析失败，返回当前时间
    return new Date().toISOString()
  }
}

// 批处理函数
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  batchSize: number = 10,
  onProgress?: (processed: number, total: number) => void,
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map((item, index) => processor(item, i + index)))

    results.push(...batchResults)

    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length)
    }
  }

  return results
}

// 错误处理包装器
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
): Promise<T | null> {
  try {
    return await operation()
  } catch (error) {
    console.error(`Error in ${context}:`, error)
    return null
  }
}

// 延迟函数
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 重试函数
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxAttempts) {
        console.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`)
        await delay(delayMs)
      }
    }
  }

  throw lastError!
}

// 日志函数
export class Logger {
  private static logFile: string | null = null

  static setLogFile(filePath: string) {
    this.logFile = filePath
    // 清空日志文件
    fs.writeFileSync(filePath, '')
  }

  static log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${level}: ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`

    console.log(logEntry.trim())

    if (this.logFile) {
      fs.appendFileSync(this.logFile, logEntry)
    }
  }

  static info(message: string, data?: any) {
    this.log('INFO', message, data)
  }

  static warn(message: string, data?: any) {
    this.log('WARN', message, data)
  }

  static error(message: string, data?: any) {
    this.log('ERROR', message, data)
  }
}
