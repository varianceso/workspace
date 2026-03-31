import { NextResponse } from 'next/server'

export async function GET() {
  // 这个端点用于检查会员状态
  // 实际验证在 /api/auth POST 时通过 cookie 设置
  return NextResponse.json({ message: 'ok' })
}
