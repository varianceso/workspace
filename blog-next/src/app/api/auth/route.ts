import { NextResponse } from 'next/server'

// 会员密码，可以改成环境变量
const MEMBER_PASSWORD = process.env.MEMBER_PASSWORD || 'vip2026'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    
    if (password === MEMBER_PASSWORD) {
      const response = NextResponse.json({ success: true })
      // 设置 cookie，有效期7天
      response.cookies.set('member_verified', 'true', {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      return response
    }
    
    return NextResponse.json({ success: false, message: '密码错误' }, { status: 401 })
  } catch {
    return NextResponse.json({ success: false, message: '请求错误' }, { status: 400 })
  }
}
