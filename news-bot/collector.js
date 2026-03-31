/**
 * RSS 采集器
 */

const Parser = require('rss-parser');

const parser = new Parser({
  timeout: 15000,
});

async function collectAll(sources) {
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

  return { articles: allArticles, errors };
}

module.exports = { collectAll };
