const NOTION_API_KEY = process.env.NOTION_API_KEY!
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID!
const NOTION_DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID || NOTION_DATABASE_ID
const NOTION_VERSION = '2025-09-03'

// Data source IDs - only active ones, no empty/invalid sources
const DATA_SOURCE_IDS = [
  '2e86698a-263b-805d-9210-000b42339747', // 文档中心
  '193f112d-e9e1-4223-8afa-1224127af111', // 新闻库
]

// Simple in-memory cache with TTL
interface CacheEntry {
  data: any
  expiry: number
}
const cache = new Map<string, CacheEntry>()
const DEFAULT_TTL = 60 * 1000

function getCached(key: string): any | null {
  const entry = cache.get(key)
  if (entry && Date.now() < entry.expiry) {
    return entry.data
  }
  cache.delete(key)
  return null
}

function setCache(key: string, data: any, ttl = DEFAULT_TTL) {
  cache.set(key, { data, expiry: Date.now() + ttl })
}

async function fetchNotion(endpoint: string, options: RequestInit = {}, retries = 3, cacheKey?: string, cacheTtl?: number): Promise<any> {
  if (cacheKey && options.method === 'GET') {
    const cached = getCached(cacheKey)
    if (cached) return cached
  }

  let lastError: Error | null = null
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`https://api.notion.com/v1/${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${NOTION_API_KEY}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
      
      if (!response.ok) {
        // 400 errors won't change with retries, throw immediately
        if (response.status === 400) {
          const body = await response.text().catch(() => '')
          throw new Error(`Notion API error: 400 - ${body.slice(0, 100)}`)
        }
        throw new Error(`Notion API error: ${response.status}`)
      }
      
      const data = await response.json()
      if (cacheKey) setCache(cacheKey, data, cacheTtl)
      return data
    } catch (err: any) {
      lastError = err
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
      }
    }
  }
  
  throw lastError
}

// 从文章属性中提取标题
function extractTitle(post: any): string {
  const props = post.properties || {}
  // Try "文档名称" (文档中心)
  const docName = props['文档名称']?.title
  if (docName?.length) return docName.map((t: any) => t.plain_text).join('')
  // Try "title" (standard)
  const title = props['title']?.title
  if (title?.length) return title.map((t: any) => t.plain_text).join('')
  // Try "Name" (新闻库)
  const name = props['Name']?.title
  if (name?.length) return name.map((t: any) => t.plain_text).join('')
  return '无标题'
}

// 从文章属性中提取发布状态
function extractStatus(post: any): string | null {
  // Status field type
  const statusProp = post.properties?.['发布']?.status
  if (statusProp) return statusProp.name
  // Select field type
  const selectProp = post.properties?.['发布']?.select
  if (selectProp) return selectProp.name
  return null
}

// 获取已发布文章（从所有数据源）
export async function getDatabase() {
  const allPosts: any[] = []
  
  for (const dsId of DATA_SOURCE_IDS) {
    try {
      const body: any = {
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      }
      
      // 只有文档中心数据源有"发布"状态过滤，新闻库没有该字段
      if (dsId !== '193f112d-e9e1-4223-8afa-1224127af111') {
        body.filter = {
          property: '发布',
          status: {
            equals: '已发布',
          },
        }
      }
      
      const response = await fetchNotion(
        `data_sources/${dsId}/query`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
        3,
        `db_ds_${dsId}`,
        2 * 60 * 1000
      )
      allPosts.push(...response.results)
    } catch (e) {
      console.error(`Failed to query data source ${dsId}:`, e)
    }
  }
  
  // Sort by created_time descending
  allPosts.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime())
  
  return allPosts
}

// 检查文章可见性
export function isMemberOnly(post: any): boolean {
  const visibility = post.properties?.['可见性']?.select?.name
  return visibility === '会员'
}

// 获取所有文章（用于管理）
export async function getAllPosts() {
  const allPosts: any[] = []
  
  for (const dsId of DATA_SOURCE_IDS) {
    try {
      const response = await fetchNotion(`data_sources/${dsId}/query`, {
        method: 'POST',
        body: JSON.stringify({
          sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        }),
      }, 3, `all_ds_${dsId}`, 2 * 60 * 1000)
      allPosts.push(...response.results)
    } catch (e) {
      console.error(`Failed to query data source ${dsId}:`, e)
    }
  }
  
  allPosts.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime())
  return allPosts
}

export async function getPage(pageId: string) {
  return fetchNotion(`pages/${pageId}`, {}, 3, `page_${pageId}`, 5 * 60 * 1000)
}

// 获取所有子块（处理分页）
export async function getBlocks(blockId: string): Promise<any[]> {
  let allBlocks: any[] = []
  let cursor: string | undefined
  
  do {
    const url = `blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`
    const response = await fetchNotion(url, {}, 3, `blocks_${blockId}_${cursor || 'start'}`, 5 * 60 * 1000)
    allBlocks = [...allBlocks, ...response.results]
    cursor = response.has_more ? response.next_cursor : undefined
  } while (cursor)
  
  return allBlocks
}
