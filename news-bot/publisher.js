/**
 * Notion 发布器 - 写入新闻内容数据库
 * 干净库（708e7d5dd9cf43bb963ff5198ff4c1e3），无多数据源限制
 * 属性：Name（标题）
 *
 * 支持的文本标记：
 * [meta]             → Notion callout（顶部元信息）
 * [heading_2: 标题]  → Notion heading_2
 * [heading_3: 标题]  → Notion heading_3
 * [bulleted_list_item: 内容] → Notion bulleted_list_item
 * [paragraph: 内容]  → Notion paragraph（可选标记）
 * [divider]          → Notion divider
 * - xxx               → Notion bulleted_list_item（裸bullet）
 * 裸文本行            → Notion paragraph
 */

const config = require('./config');

function buildBlocks(content) {
  const blocks = [];

  function isMetaTag(line) {
    return line.trim() === '[meta]';
  }

  function isTag(line, tag) {
    const t = line.trim();
    if (tag === 'divider') return t === '[divider]' || t === '[divider ]';
    if (tag === 'meta') return isMetaTag(line);
    return t.startsWith(`[${tag}:`);
  }

  function extractTag(line, tag) {
    const regex = new RegExp(`^\\[${tag}:\\s*(.*)`);
    const m = line.match(regex);
    return m ? m[1].trim() : '';
  }

  function pushPara(text) {
    const t = text.trim();
    if (!t) return;
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: t } }] },
    });
  }

  function pushBulleted(text) {
    const t = text.trim();
    if (!t) return;
    blocks.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: { rich_text: [{ type: 'text', text: { content: t } }] },
    });
  }

  function pushH2(text) {
    const t = text.trim();
    if (!t) return;
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: t } }], color: 'default' },
    });
  }

  function pushH3(text) {
    const t = text.trim();
    if (!t) return;
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: { rich_text: [{ type: 'text', text: { content: t } }], color: 'default' },
    });
  }

  function pushCallout(text) {
    const t = text.trim();
    if (!t) return;
    blocks.push({
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [{ type: 'text', text: { content: t } }],
        icon: { type: 'emoji', emoji: '📌' },
      },
    });
  }

  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw;
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // [divider]
    if (isTag(line, 'divider')) {
      blocks.push({ object: 'block', type: 'divider', divider: {} });
      i++;
      continue;
    }

    // [meta] - 收集所有后续非tag行作为元信息callout
    if (isTag(line, 'meta')) {
      let metaLines = [];
      i++;
      while (i < lines.length) {
        const next = lines[i].trim();
        if (!next) break;
        if (/^\[(heading_|bulleted_list_item|paragraph|divider|meta|callout)/.test(next)) break;
        metaLines.push(next);
        i++;
      }
      pushCallout(metaLines.join('\n'));
      continue;
    }

    // [heading_2: 标题]
    if (isTag(line, 'heading_2')) {
      const text = extractTag(line, 'heading_2');
      pushH2(text);
      i++;
      continue;
    }

    // [heading_3: 标题]
    if (isTag(line, 'heading_3')) {
      const text = extractTag(line, 'heading_3');
      pushH3(text);
      i++;
      continue;
    }

    // [bulleted_list_item: 内容]
    if (isTag(line, 'bulleted_list_item')) {
      const text = extractTag(line, 'bulleted_list_item');
      pushBulleted(text);
      i++;
      continue;
    }

    // 裸 bullet 行
    if (trimmed.startsWith('- ')) {
      pushBulleted(trimmed.substring(2));
      i++;
      continue;
    }

    // 普通文本行 → paragraph
    pushPara(trimmed);
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
