/**
 * Notion 发布器 - 写入新闻内容数据库
 * 干净库（708e7d5dd9cf43bb963ff5198ff4c1e3），无多数据源限制
 * 属性：Name（标题）
 */

const config = require('./config');

/**
 * 将结构化文章内容转换为 Notion 块数组
 *
 * 章节标记： 【标题】【新闻】【思考】【相关阅读】
 *
 * 块类型规则：
 * - "标题"：内容作为 paragraph（不用 heading_2）
 * - "新闻/思考"：heading_2 + 内容 paragraph
 * - "相关阅读"：heading_2 + 内容 paragraph
 * - 其他非空行：paragraph
 */
function buildBlocks(content) {
  const blocks = [];

  function isSectionHeader(t) {
    return t.startsWith('【') && t.includes('】') && t.endsWith('】');
  }

  function sectionLabel(t) {
    const m = t.match(/^【([^】]+)】/);
    return m ? m[1] : '';
  }

  function pushParagraph(text) {
    if (!text.trim()) return;
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: text.trim() } }] },
    });
  }

  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) { i++; continue; }
    if (trimmed === '---') {
      blocks.push({ object: 'block', type: 'divider', divider: {} });
      i++;
      continue;
    }

    if (isSectionHeader(trimmed)) {
      const label = sectionLabel(trimmed);
      const rest = trimmed.replace(/^【[^】]+】\s*/, '').trim();

      // "标题" section：内容作为 paragraph，不加 heading_2
      if (label === '标题') {
        if (rest) pushParagraph(rest);
        i++;
        continue;
      }

      // 其他章节：加 heading_2
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: label } }], color: 'default' },
      });

      if (rest) pushParagraph(rest);
      i++;
      continue;
    }

    pushParagraph(trimmed);
    i++;
  }

  return blocks;
}

async function publishToNotion(article) {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error('缺少 NOTION_API_KEY 环境变量');

  const { databaseId } = config.notion;
  const children = buildBlocks(article.content);

  const createRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2025-09-03',
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        'Name': {
          title: [{ type: 'text', text: { content: article.title } }],
        },
      },
      children,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(`Notion error ${createRes.status}: ${err.message}`);
  }

  const page = await createRes.json();
  return page.id;
}

module.exports = { publishToNotion };
