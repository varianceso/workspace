/**
 * AI 内容生成器 - MiniMax API
 *
 * 文章模板：Notion 文章写作模板（标准二：新闻解读）
 * 页面 ID：3346698a-263b-81f5-b70b-eac67eb7c7d2
 *
 * 输出格式：
 * [meta] 新闻来源 | 新闻链接 | 一句话概括
 * [heading_2: 【新闻内容】] 正文2-3段
 * [heading_2: 【技术演进/核心问题】] bullet list
 * [heading_2: 【关键洞察】] heading_3 + 正文
 * [heading_2: 【引发思考】] 正文1-2段
 * [heading_2: 【相关阅读】] bullet + 落款
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
  const hasContent = (article.content || '').trim().length > 30;

  const prompt = `你是一个顶尖科技专栏作者，服务于对科技/AI/汽车领域感兴趣的成熟读者。

## 任务
为下面的新闻写一篇 Notion 文章，严格按「标准二：新闻解读」模板输出。

## 标准二模板结构

---
[meta]
新闻来源：${article.source}（${article.published || 'YYYY-MM-DD'}）
新闻链接：${article.url}
一句话概括：（用一句话讲清楚这条新闻的核心事件，15-25字）

[heading_2: 【新闻内容】]
（第1段：事件本身，核心事实，包含关键数字）
（第2段：技术背景，为什么值得关注）
（第3段：竞品/市场对比，或这件事的深层原因）

[heading_2: 【技术演进/核心问题】]
（用数字和对比讲清楚技术要点，3-5个bullet）
- 要点1：（技术指标 + 与竞品/旧方案对比）
- 要点2：（技术指标 + 与竞品/旧方案对比）
- 要点3：（技术指标 + 与竞品/旧方案对比）

[heading_2: 【关键洞察】]
[heading_3: 1. （核心论点，一句话）]
（展开论证，1段，有观点有判断，不要两面话）

[heading_3: 2. （核心论点，一句话）]
（展开论证，1段）

[heading_3: 3. （核心论点，一句话）]
（展开论证，1段）

[heading_2: 【引发思考】]
（1-2段，从技术趋势或产业影响角度展开，有预判）

[heading_2: 【相关阅读】]
- ${article.source}：${article.url}
逍遥云初 | ${new Date().toLocaleDateString('zh-CN').replace(/\//g, '.')}

---

## 写作要求

1. **语气**：第一人称"我"，真实有观点，不水文，不拍马屁
2. **数字**：所有金额/比例/时间都要具体标注（如：27.5亿美元、2027年）
3. **结构**：严格按模板输出，标记格式要完整
4. **洞察**：每个 heading_3 下的正文要有论点有论证，不要空洞
5. **落款**：固定写"逍遥云初 | YYYY.MM.DD"，日期用今天的
6. **空白**：没有对应内容的章节整个删掉，不要留空

## 新闻素材

${hasContent ? article.content : '（无正文内容，基于标题和领域知识写作，涉及数据请标注"据公开信息"）'}

请严格按照「标准二」模板格式输出所有内容。`;

  let content = await chat(prompt);

  if (!isClean(content)) {
    throw new Error('内容含敏感词，已跳过');
  }

  // 验证必要部分
  const hasNews = content.includes('【新闻内容】');
  const hasTech = content.includes('【技术演进');
  const hasInsight = content.includes('【关键洞察】');
  const hasThink = content.includes('【引发思考】');
  const hasRef = content.includes('【相关阅读】');

  if (!hasNews || !hasTech || !hasInsight || !hasThink || !hasRef) {
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
