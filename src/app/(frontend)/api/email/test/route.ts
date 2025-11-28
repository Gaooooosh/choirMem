import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  const payload = await getPayload({ config })
  try {
    await payload.sendEmail?.({
      to: String(process.env.SMTP_USER || ''),
      subject: 'ChoirMem 邮件测试',
      html: '<p>这是一封测试邮件，用于验证SMTP配置是否可用。</p>',
    })
    return NextResponse.json({ message: '已尝试发送测试邮件' })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

