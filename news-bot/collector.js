/**
 * RSS 采集器 + Tavily 搜索
 */

const Parser = require('rss-parser');
const TAVILY_API_KEY = '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';

const parser = new Parser({
  timeout: 15000,
});

async function searchTavily(query) {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        max_results: 3,
        include_answer: false,
        include_raw_content: false,
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.results || []).map(r => ({
      title: r.title || '无标题',
      url: r.url || '',
      source: 'Tavily',
      published: r.published_date || null,
      content: r.content || '',
    })).filter(a => a.url && a.title);
  } catch (err) {
    console.warn(`Tavily search failed for "${query}": ${err.message}`);
    return [];
  }
}

async function collectAll(sources, agentTopics = []) {
  // 1. RSS 采集
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const feed = await parser.parseURL(source.url);
      return (feed.items || []).map(item => ({
        title: item.title || '无标题',
        url: item.link || item.guid || '',
        source: source.name,
        published: item.pubDate || item.isoDate || null,
        content: item.contentSnippet || item.content || '',
      })).filter(item => item.url && item.title);
    })
  );

  const allArticles = [];
  const errors = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const sourceName = sources[i].name;
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    } else {
      errors.push(`${sourceName}: ${result.reason?.message || result.reason}`);
    }
  }

  // 2. Tavily 搜索（覆盖 Agent/AI 开发新主题）
  if (agentTopics && agentTopics.length > 0) {
    // 每次最多搜2个主题，避免重复
    const topicsToSearch = agentTopics.slice(0, 2);
    const tavilyResults = await Promise.allSettled(
      topicsToSearch.map(q => searchTavily(q))
    );
    for (const r of tavilyResults) {
      if (r.status === 'fulfilled') {
        allArticles.push(...r.value);
      }
    }
  }

  return { articles: allArticles, errors };
}

module.exports = { collectAll };
