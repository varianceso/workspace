/**
 * AI 内容生成器 - MiniMax API
 *
 * 文章模板：Notion 标准二（新闻解读）
 * 页面 ID：3346698a-263b-81f5-b70b-eac67eb7c7d2
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

// 根据关键词自动识别 Notion 分类
function detectCategory(title, content) {
  const text = (title + ' ' + (content || '')).toLowerCase()
  if (/\b(car|汽车|电动车|电池|固态|闪充|比亚迪|新能源|自动驾驶|l4|pilot|买车|购车|车型)\b/.test(text)) return '汽车'
  if (/\b(agent|cli|coding|swe|openhand|langgraph|crewai|mcp|llm|大模型|推理|moe|long context|context window|claude code|gemini cli|copilot)\b/.test(text)) return 'AI'
  if (/\b(robot|机器人|人形机器人|灵巧手|机械臂|四足)\b/.test(text)) return '机器人'
  if (/\b(openclaw|skill|调度|session|插件)\b/.test(text)) return 'OpenClaw'
  return '其他'
}

async function generateArticle(article) {
  const hasContent = (article.content || '').trim().length > 30;

  const prompt = `你是一个顶尖科技专栏作者，服务于对科技/AI/汽车领域感兴趣的成熟读者。

## 任务
为下面这条新闻写一篇 Notion 文章，严格按以下模板格式输出。

## 输出格式（直接输出正文，不要包含模板说明文字）

[meta]
新闻来源：${article.source}
日期：${article.published || new Date().toLocaleDateString('zh-CN')}
链接：${article.url}
一句话概括：（15-25字）

[heading_2: 新闻内容]
（分2-3段完整正文，每段2-4句。第1段讲事件本身，第2段补充技术背景或市场上下文，第3段可选。直接写正文，不要标注"第1段"之类）

[heading_2: 技术要点]
- 要点1：（含具体数字和对比）
- 要点2：（含具体数字和对比）
- 要点3：（含具体数字和对比）

[heading_2: 关键洞察]
[heading_3: 1. （核心观点，一句话）]
（1段正文展开，要有判断，不要两面话）

[heading_3: 2. （核心观点，一句话）]
（1段正文展开）

[heading_3: 3. （核心观点，一句话）]
（1段正文展开）

[heading_2: 思考]
（1-2段，从技术趋势或行业影响角度，有预判）

[heading_2: 相关阅读]
- ${article.source}：${article.url}
逍遥云初 | ${new Date().toLocaleDateString('zh-CN').replace(/\//g, '.')}

## 写作要求
- 第一人称"我"，有观点有态度，不水文不拍马
- 所有数字（金额/比例/时间）都要标注
- 不要在正文里写"（第1段）"这样的引导文字
- 没有相关内容就不写那个章节，不要留空

## 新闻素材
${hasContent ? article.content : '（无正文，基于标题和领域知识写，数据标注"据公开信息"）'}
`;

  let content = await chat(prompt);

  if (!isClean(content)) {
    throw new Error('内容含敏感词，已跳过');
  }

  // 宽松验证：必须有基本结构
  const hasH2 = (content.match(/\[heading_2:/g) || []).length;
  if (hasH2 < 3) {
    throw new Error('生成内容格式不完整，已跳过');
  }

  return {
    title: `💡 ${article.title}`,
    content: content,
    source: article.source,
    url: article.url,
    published: article.published,
    category: detectCategory(article.title, hasContent ? article.content : ''),
  };
}

module.exports = { generateArticle, isClean };
