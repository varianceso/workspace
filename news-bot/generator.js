/**
 * AI 内容生成器 - MiniMax API
 *
 * 输出结构（科技专栏风格）：
 * 【标题】一句话概括，吸人眼球
 * 【新闻】具体内容，核心摘录标注来源
 * 【思考】300-500字，分段，有观点有态度有预判
 * 【相关阅读】原文链接 + 来源时间
 */

const config = require('./config');
const { minimax } = config;

async function chat(prompt) {
  const response = await fetch(`${minimax.baseUrl}/v1/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${minimax.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: minimax.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: config.generation.temperature,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`MiniMax API error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function isClean(text) {
  const lower = text.toLowerCase();
  return !config.blockKeywords.some(kw => lower.includes(kw.toLowerCase()));
}

async function generateArticle(article) {
  const hasContent = (article.content || '').trim().length > 50;

  const prompt = `你是一个顶尖科技专栏作者，服务于对科技/AI/汽车领域感兴趣的成熟读者。

## 写作要求

**语气与立场**：第一人称"我"，真实有观点，不溜须拍马，不水文，不说废话。
**内容**：严格基于提供的新闻内容写作，不要编造数据或事实，不会就说不会。
**结构**：每部分内容要充实，不要一行就结束。

## 你的读者是这样的人
- 有基本科技素养，不需要解释什么是 LLM、固态电池
- 看过太多科技通稿，要的是真正有观点的分析
- 关心这件事对自己的影响（工作、投资、消费决策）

## 输出格式（严格按此输出，【】标记不能缺少任何一个）

---
【标题】
（一句话概括，要吸睛，能引发好奇或共鸣，15-30字）

【新闻】
（从新闻素材中提取核心内容，2-4段，包含关键事实、数字、来源标注。如果内容来自财报或官方发布，请注明"据XX财报/官方公告"。）

【思考】
（300-500字，分3-4段写。要包含：
- 这件事的本质是什么
- 对读者可能的影响（具体说，不要泛泛而谈"改变生活"）
- 你的判断或预判（敢说不确定，不要两面话说尽）
语言要有温度，像在跟朋友聊天，但观点要鲜明。）

【相关阅读】
原文链接：${article.url}
来源：${article.source} | 时间：${article.published || '未知'}
---

${hasContent ? '## 新闻素材（严格据此写作，不要超出范围）\n' + article.content : '⚠️ 注意：该新闻未提供正文内容，请基于标题和你的领域知识写作，如涉及具体数据请标注"据公开信息"。'}`;

  let content = await chat(prompt);

  if (!isClean(content)) {
    throw new Error('内容含敏感词，已跳过');
  }

  const hasTitle = content.includes('【标题】');
  const hasNews = content.includes('【新闻】');
  const hasOpinion = content.includes('【思考】');
  const hasRef = content.includes('【相关阅读】');

  if (!hasTitle || !hasNews || !hasOpinion || !hasRef) {
    throw new Error('生成内容格式不完整，已跳过');
  }

  return {
    title: `💡 ${article.title}`,
    content: content,
    source: article.source,
    url: article.url,
    published: article.published,
  };
}

module.exports = { generateArticle, isClean };
