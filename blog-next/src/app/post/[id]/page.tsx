import { getPage, getBlocks, isMemberOnly } from '@/lib/notion'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import PasswordInput from '@/components/PasswordInput'

export const dynamic = 'force-dynamic'

// 检查是否为会员
async function isMember(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get('member_verified')?.value === 'true'
}

// 渲染 Notion 块
function renderBlock(block: any) {
  const { type, id } = block
  const value = block[type]

  switch (type) {
    case 'paragraph':
      const paraText = value.rich_text.map((t: any) => t.plain_text).join('')
      if (!paraText.trim()) return null
      return (
        <p className="my-4">
          {value.rich_text.map((t: any, i: number) => {
            const styles: any = {}
            if (t.annotations?.bold) styles.fontWeight = 'bold'
            if (t.annotations?.italic) styles.fontStyle = 'italic'
            if (t.annotations?.code) {
              return <code key={i} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{t.plain_text}</code>
            }
            if (t.href) {
              return <a key={i} href={t.href} className="text-blue-600 underline" target="_blank" rel="noopener">{t.plain_text}</a>
            }
            return <span key={i} style={styles}>{t.plain_text}</span>
          })}
        </p>
      )
    case 'heading_1':
      return <h1 className="text-3xl font-bold mt-10 mb-5">{value.rich_text.map((t: any) => t.plain_text).join('')}</h1>
    case 'heading_2':
      return <h2>{value.rich_text.map((t: any) => t.plain_text).join('')}</h2>
    case 'heading_3':
      return <h3 className="text-xl font-bold mt-6 mb-3">{value.rich_text.map((t: any) => t.plain_text).join('')}</h3>
    case 'bulleted_list_item':
      return <li className="ml-6 mb-2 list-disc">{value.rich_text.map((t: any) => t.plain_text).join('')}</li>
    case 'numbered_list_item':
      return <li className="ml-6 mb-2 list-decimal">{value.rich_text.map((t: any) => t.plain_text).join('')}</li>
    case 'quote':
      return (
        <blockquote>
          {value.rich_text.map((t: any) => t.plain_text).join('')}
        </blockquote>
      )
    case 'code':
      return (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-6 text-sm">
          <code>{value.rich_text.map((t: any) => t.plain_text).join('')}</code>
        </pre>
      )
    case 'to_do':
      return (
        <div className="flex items-start gap-3 my-2">
          <input
            type="checkbox"
            checked={value.checked}
            readOnly
            className="mt-1 w-4 h-4 accent-amber-500 flex-shrink-0"
          />
          <span className={value.checked ? 'line-through text-gray-400' : ''}>
            {value.rich_text.map((t: any, i: number) => {
              const styles: any = {}
              if (t.annotations?.bold) styles.fontWeight = 'bold'
              if (t.annotations?.italic) styles.fontStyle = 'italic'
              if (t.annotations?.code) {
                return <code key={i} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{t.plain_text}</code>
              }
              if (t.href) {
                return <a key={i} href={t.href} className="text-blue-600 underline" target="_blank" rel="noopener">{t.plain_text}</a>
              }
              return <span key={i} style={styles}>{t.plain_text}</span>
            })}
          </span>
        </div>
      )
    case 'divider':
      return <hr />
    case 'callout': {
      const calloutText = value.rich_text.map((t: any) => t.plain_text).join('')
      if (!calloutText.trim()) return null
      const colorMap: Record<string, string> = {
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        green: 'bg-green-50 border-green-200 text-green-800',
        blue: 'bg-blue-50 border-blue-200 text-blue-800',
        red: 'bg-red-50 border-red-200 text-red-800',
        purple: 'bg-purple-50 border-purple-200 text-purple-800',
        gray: 'bg-gray-50 border-gray-200 text-gray-800',
        default: 'bg-gray-50 border-gray-200 text-gray-800',
      }
      const colorClass = colorMap[value.color] || colorMap.default
      const emoji = value.icon?.type === 'emoji' ? value.icon.emoji : '💡'
      return (
        <div className={`flex items-start gap-3 my-4 p-4 rounded-lg border ${colorClass}`}>
          <span className="text-2xl flex-shrink-0">{emoji}</span>
          <div className="flex-1">
            {value.rich_text.map((t: any, i: number) => {
              const styles: any = {}
              if (t.annotations?.bold) styles.fontWeight = 'bold'
              if (t.annotations?.italic) styles.fontStyle = 'italic'
              if (t.annotations?.code) {
                return <code key={i} className="bg-white/50 px-1 py-0.5 rounded text-sm font-mono">{t.plain_text}</code>
              }
              if (t.href) {
                return <a key={i} href={t.href} className="underline" target="_blank" rel="noopener">{t.plain_text}</a>
              }
              return <span key={i} style={styles}>{t.plain_text}</span>
            })}
          </div>
        </div>
      )
    }
    case 'image':
      const imageUrl = value.type === 'external' ? value.external?.url : value.file?.url
      return imageUrl ? (
        <figure className="my-6">
          <img src={imageUrl} alt="" className="w-full rounded-lg" />
          {value.caption?.length > 0 && (
            <figcaption className="text-center text-gray-500 text-sm mt-2">
              {value.caption[0]?.plain_text}
            </figcaption>
          )}
        </figure>
      ) : null
    default:
      return null
  }
}

export default async function Post({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  try {
    const page = await getPage(id)
    const blocks = await getBlocks(id)
    const isVip = await isMember()
    const memberOnly = isMemberOnly(page as any)

    const title =
      (page as any).properties?.['文档名称']?.title?.[0]?.plain_text ||
      (page as any).properties?.['Name']?.title?.[0]?.plain_text ||
      (page as any).properties?.['title']?.title?.[0]?.plain_text ||
      '无标题'
    const date = (page as any).properties?.['创建时间']?.created_time?.slice(0, 10) || ''
    const tags = (page as any).properties?.['类别']?.multi_select || []
    const primaryTag = tags[0]?.name || ''

    // 如果是会员文章但用户不是会员，显示锁定页面
    if (memberOnly && !isVip) {
      return (
        <main>
          <div className="hero">
            <h1 className="text-4xl font-normal text-white text-center px-5 title-font">{title}</h1>
          </div>
          
          <article className="article-container">
            <div className="mb-8">
              <Link href="/" className="text-amber-700 hover:text-amber-900 text-sm no-underline">← 返回首页</Link>
            </div>
            
            <div className="max-w-md mx-auto">
              <PasswordInput onSuccess={() => {}} targetId={id} />
            </div>
          </article>
          
          <footer className="text-center py-10 text-gray-400 text-sm">
            © 2026 逍遥云初
          </footer>
        </main>
      )
    }

    return (
      <main>
        {/* 顶部封面 */}
        <div className="hero">
          <h1 className="text-4xl font-normal text-white text-center px-5 title-font">
            {memberOnly && <span className="mr-2">👑</span>}
            {title}
          </h1>
        </div>
        
        <article className="article-container">
          <div className="mb-8">
            <Link href="/" className="text-amber-700 hover:text-amber-900 text-sm no-underline">← 返回首页</Link>
          </div>
          
          <div className="text-gray-400 text-xs pb-5 border-b border-gray-100 mb-8 tracking-widest">
            逍遥云初 | {date.replace(/-/g, '.')}
          </div>
          
          <div className="content">
            {blocks.map((block: any) => (
              <div key={block.id}>
                {renderBlock(block)}
              </div>
            ))}
          </div>
        </article>
        
        <footer className="text-center py-10 text-gray-400 text-sm">
          逍遥云初 | {new Date().getFullYear()}
        </footer>
      </main>
    )
  } catch (error) {
    return notFound()
  }
}
