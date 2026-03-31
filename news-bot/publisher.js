/**
 * Notion 发布器 - 写入新闻内容数据库
 * 干净库（708e7d5dd9cf43bb963ff5198ff4c1e3），无多数据源限制
 * 属性：Name（标题）
 *
 * 文章模板：Harness Engineering 风格
 * 支持的文本标记：
 * [heading_2: 标题] → Notion heading_2
 * [heading_3: 标题] → Notion heading_3
 * [callout: 内容]  → Notion callout
 * [checklist: 内容] → Notion to_do
 * [divider]        → Notion divider
 * 裸文本行 → Notion paragraph
 */

const config = require('./config');

function buildBlocks(content) {
  const blocks = [];
  const lines = content.split('\n');
  let i = 0;

  function isSectionTag(line, tag) {
    const t = line.trim();
    if (tag === 'divider') return t === '[divider]' || t === '[divider ]';
    return t.startsWith(`[${tag}:`);
  }

  function extractSectionContent(line, tag) {
    const regex = new RegExp(`^\\[${tag}:\\s*(.*)`);
    const m = line.match(regex);
    return m ? m[1].replace(/]\s*$/, '').trim() : '';
  }

  function pushParagraph(text) {
    const t = text.trim();
    if (!t) return;
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: t } }] },
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
        icon: { type: 'emoji', emoji: '💡' },
      },
    });
  }

  function pushChecklist(text) {
    const t = text.trim();
    if (!t) return;
    blocks.push({
      object: 'block',
      type: 'to_do',
      to_do: {
        rich_text: [{ type: 'text', text: { content: t } }],
        checked: false,
      },
    });
  }

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw;

    // [divider]
    if (isSectionTag(line, 'divider')) {
      blocks.push({ object: 'block', type: 'divider', divider: {} });
      i++;
      continue;
    }

    // [heading_2: 标题]
    if (isSectionTag(line, 'heading_2')) {
      const text = extractSectionContent(line, 'heading_2');
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: { rich_text: [{ type: 'text', text: { content: text } }], color: 'default' },
      });
      i++;
      continue;
    }

    // [heading_3: 标题]
    if (isSectionTag(line, 'heading_3')) {
      const text = extractSectionContent(line, 'heading_3');
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: { rich_text: [{ type: 'text', text: { content: text } }], color: 'default' },
      });
      i++;
      continue;
    }

    // [callout: 内容] 或 [meta callout] 开头
    if (isSectionTag(line, 'callout') || line.trim().startsWith('[meta callout')) {
      let calloutText = '';
      // 如果是 [meta callout - xxx] 格式，收集后续行直到遇到 tag
      if (line.trim().startsWith('[meta callout')) {
        i++;
        while (i < lines.length) {
          const next = lines[i].trim();
          if (!next) break;
          if (/^\[(heading_|callout:|checklist:|divider)/.test(next)) break;
          calloutText += (calloutText ? '\n' : '') + next;
          i++;
        }
      } else {
        calloutText = extractSectionContent(line, 'callout');
        i++;
        while (i < lines.length) {
          const next = lines[i].trim();
          if (!next) break;
          if (/^\[(heading_|callout:|checklist:|divider)/.test(next)) break;
          // 如果是 bullet 行（- 开头），转为 paragraph
          if (next.startsWith('- ')) {
            pushParagraph(next.substring(2));
            i++;
            continue;
          }
          calloutText += '\n' + next;
          i++;
        }
      }
      if (calloutText.trim()) pushCallout(calloutText.trim());
      continue;
    }

    // [checklist: 内容]
    if (isSectionTag(line, 'checklist')) {
      const text = extractSectionContent(line, 'checklist');
      pushChecklist(text);
      i++;
      continue;
    }

    // 普通文本行
    pushParagraph(line);
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
