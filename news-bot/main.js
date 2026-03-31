/**
 * 新闻机器人 - 主入口
 *
 * 运行方式：
 *   node main.js           # 运行一次
 *   node main.js --daemon  # 守护模式（定时采集）
 *   node main.js --now     # 手动触发（等同于 --daemon 但只跑一次）
 */

const config = require('./config');
const { initDb, isProcessed, markProcessed, startRun, finishRun } = require('./db');
const { collectAll } = require('./collector');
const { generateArticle } = require('./generator');
const { publishToNotion } = require('./publisher');

initDb();

async function run() {
  const runId = startRun();
  let collected = 0, published = 0;
  let error = null;

  console.log(`\n[${new Date().toLocaleString('zh-CN')}] 开始采集...`);

  // 1. 采集 RSS
  const { articles, errors } = await collectAll(config.rssSources);
  collected = articles.length;

  if (errors.length) {
    console.warn('⚠️ 采集异常:', errors.join('; '));
  }
  console.log(`✅ 采集到 ${collected} 篇，来自 ${config.rssSources.length} 个源`);

  // 2. 过滤未处理的
  const newArticles = articles.filter(a => !isProcessed(a.url));
  console.log(`🆕 其中 ${newArticles.length} 篇为新文章`);

  // 3. 最多处理 N 篇
  const toProcess = newArticles.slice(0, config.generation.maxArticlesPerRun);

  for (const article of toProcess) {
    try {
      console.log(`\n  📝 处理中: ${article.title.slice(0, 45)}...`);

      // 生成评论
      const generated = await generateArticle(article);

      // 发布到 Notion 草稿
      const notionId = await publishToNotion(generated);

      // 标记已处理
      markProcessed(article.url, article.title, article.source, article.published, notionId);
      published++;

      console.log(`  ✅ 已发布 (Notion ID: ${notionId.slice(0, 8)}...)`);
    } catch (err) {
      console.error(`  ❌ 失败: ${err.message}`);
      error = err.message;
    }
  }

  finishRun(runId, collected, published, error);
  console.log(`\n[${new Date().toLocaleString('zh-CN')}] 完成！新发布 ${published} 篇`);

  return { collected, published };
}

async function main() {
  const isDaemon = process.argv.includes('--daemon');
  const isNow = process.argv.includes('--now');

  try {
    if (isDaemon || isNow) {
      if (isNow) {
        console.log('🚀 手动触发模式');
        await run();
      } else {
        console.log('🟢 新闻机器人已启动（守护模式，每30分钟一次）');
        await run();
        setInterval(async () => {
          try { await run(); } catch (err) { console.error('运行错误:', err); }
        }, config.collectInterval);
      }
    } else {
      await run();
    }
  } catch (err) {
    console.error('❌ 致命错误:', err);
    process.exit(1);
  }
}

main();
