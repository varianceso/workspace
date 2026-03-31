import Link from 'next/link'
import { getDatabase, isMemberOnly } from '@/lib/notion'
import { cache } from 'react'
import MemberUnlock from '@/components/MemberUnlock'
import { cookies } from 'next/headers'

// 使用 cache 避免重复请求
const getPosts = cache(async () => {
  const posts = await getDatabase()
  return posts
})

export const dynamic = 'force-dynamic'

// 分类颜色映射
const categoryColors: Record<string, string> = {
  '系统与历史': 'category-系统与历史',
  '记录与思考': 'category-记录与思考',
  '小说': 'category-小说',
  '技术与现实': 'category-技术与现实',
  '经典语录': 'category-经典语录',
  '大纲': 'category-大纲',
  '纪实与复盘': 'category-记录与思考',
}

// 检查是否为会员
async function isMember(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get('member_verified')?.value === 'true'
}

export default async function Home() {
  let posts: any[] = []
  let fetchError = false
  try {
    posts = await getPosts()
  } catch (e) {
    console.error('Failed to fetch posts:', e)
    fetchError = true
  }
  const isVip = await isMember()

  return (
    <main>
      {fetchError && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '12px 16px',
          margin: '16px 0',
          color: '#92400e',
          fontSize: '14px',
          textAlign: 'center',
        }}>
          ⚠️ 数据获取中，请稍后刷新页面
        </div>
      )}
      {/* 顶部区域 */}
      <div className="hero">
        <div className="text-center">
          <h1 className="text-5xl font-normal text-white mb-3 tracking-widest title-font">逍遥云初</h1>
          <p className="text-white/70 text-sm tracking-widest">记录 · 思考 · 成长</p>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="max-w-2xl mx-auto px-5 py-8">
        {posts.map((post: any) => {
          const title =
            post.properties?.['文档名称']?.title?.[0]?.plain_text ||
            post.properties?.['Name']?.title?.[0]?.plain_text ||
            post.properties?.['title']?.title?.[0]?.plain_text ||
            '无标题'
          const date = post.properties?.['创建时间']?.created_time?.slice(0, 10) || ''
          const tags = post.properties?.['类别']?.multi_select || []
          const primaryTag = tags[0]?.name || ''
          const memberOnly = isMemberOnly(post)
          
          const getBorderColor = (tag: string) => {
            if (tag === '系统与历史') return '#e74c3c'
            if (tag === '记录与思考') return '#3498db'
            if (tag === '小说') return '#9b59b6'
            if (tag === '技术与现实') return '#e67e22'
            return '#8b7355'
          }

          // 如果是会员文章但用户不是会员，显示锁定状态
          if (memberOnly && !isVip) {
            return (
              <div
                key={post.id}
                className="block bg-white rounded-md p-6 mb-4 shadow-sm border-l-4 opacity-75"
                style={{ borderLeftColor: getBorderColor(primaryTag) }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <h2 className="text-lg font-medium text-gray-800 mb-1">{title}</h2>
                    <div className="text-gray-400 text-xs mb-2">{date} · {primaryTag} · 会员专属</div>
                  </div>
                </div>
                <div className="mt-4">
                  <MemberUnlock targetId={post.id} />
                </div>
              </div>
            )
          }

          return (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="block bg-white rounded-md p-6 mb-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border-l-4"
              style={{ borderLeftColor: getBorderColor(primaryTag) }}
            >
              <div className="flex items-center gap-2">
                {memberOnly && <span className="text-sm">👑</span>}
                <h2 className="text-lg font-medium text-gray-800 mb-1">{title}</h2>
              </div>
              <div className="text-gray-400 text-xs mb-2">{date} · {primaryTag}</div>
            </Link>
          )
        })}
      </div>

      <footer className="text-center py-10 text-gray-400 text-sm">
        © 2026 逍遥云初
      </footer>
    </main>
  )
}
