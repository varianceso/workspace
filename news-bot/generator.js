/**
 * AI 内容生成器 - MiniMax API
 *
 * 文章模板参考：Harness Engineering 深度解读
 * 结构：meta callout → 核心问题 → 章节（一、二、三...）→ checklist → 相关链接
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
参考下面这篇优秀文章的结构和风格，生成格式完全一致的文章。

## 参考结构模板

---
[meta callout - 顶部放置]
来源：XX媒体 | 时间：YYYY-MM-DD
原文：链接

[heading_2: 这篇文章在讲什么]
（2-3段paragraph。第一段：背景+核心事实，有具体数字。第二段：本质一句话。第三段：核心洞察。）

[callout - 一句话总结]
（核心观点，一句话，朗朗上口，便于记忆）

[divider]

[heading_2: 一、XXX（核心主题）]
（章节导语，1-2句说明这节要讲什么）

[heading_3: 1. 第一个要点]
（正文叙述，有观点有事实）
（自然过渡到下一个点）

[heading_3: 2. 第二个要点]
（正文叙述）
[callout: 关键洞察/金句 - 一句话，要有洞察力]

[heading_3: 3. 第三个要点]
（正文叙述）

[divider]

[heading_2: 二、YYY（第二个核心主题）]
...

[divider]

[heading_2: 三、综合结论/影响判断]
（总结+预判，要有态度，不要两面话说尽）

[callout: 三点核心结论，每点一句话]

[divider]

[heading_2: Checklist - 可操作要点]
[heading_3: 环境/背景]
☐ 要点1
☐ 要点2

[heading_3: 认知/判断]
☐ 要点1
☐ 要点2

[divider]

[heading_2: 相关阅读]
原文链接：URL
来源：媒体名 | 时间：YYYY-MM-DD

---

## 写作要求

1. **语气**：第一人称"我"，真实有观点，不水文，不拍马屁
2. **数字**：所有金额/比例/时间都要具体，标注来源
3. **结构**：严格按上述模板，章节标题带序号（一、二、三...），子标题带数字（1. 2. 3.）
4. **Callout**：只放关键洞察/金句，一句话，不要长段落，每个callout控制在50字以内
5. **结尾**：有明确判断或预判，敢说不确定，不要"一方面另一方面"两面话
6. **字数**：正文部分（不含模板标记）500-800字

## 格式规则

- 每个章节用 [heading_2: 标题] 标记
- 每个子节用 [heading_3: 标题] 标记
- 每个 callout（金句/洞察）用 [callout: 内容] 标记
- checklist 用 [checklist: 内容] 标记
- 分隔线用 [divider] 标记
- 输出纯文本，用上述标记区分块类型，不要用 markdown 符号

## 新闻素材

来源：${article.source} | 时间：${article.published || '未知'}
原文：${article.url}

${hasContent ? '---素材内容---' + article.content : '⚠️ 无正文内容，基于标题和领域知识写作，涉及数据请标注"据公开信息"。'}

---

请严格按照上述模板格式输出所有内容。`;

  let content = await chat(prompt);

  if (!isClean(content)) {
    throw new Error('内容含敏感词，已跳过');
  }

  // 验证必要部分存在
  const hasHeader = content.includes('[heading_2:') || content.includes('这篇文章在讲什么');
  const hasChecklist = content.includes('[heading_2:') && content.includes('Checklist');
  const hasRef = content.includes('原文链接') || content.includes('[heading_2:');

  if (!hasHeader || !hasRef) {
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
