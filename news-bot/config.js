/**
 * 新闻机器人配置
 */

module.exports = {
  notion: {
    // 干净库（无多数据源限制）
    databaseId: '708e7d5dd9cf43bb963ff5198ff4c1e3',
  },

  minimax: {
    baseUrl: 'https://api.minimaxi.com',
    apiKey: 'sk-cp-p1lr36wmoABLr505CaisHsSJViy7toJJGANh-zSnOkWBnKl9JNm-xR8fnUqDBNCuIsDhG6E88dtO5I3WdmvXwl9Yg1Q7ytxtJ6Goun3IKKKXorF12AwPYdk',
    model: 'MiniMax-M2.7',
  },

  // RSS 订阅源（科技/AI/汽车）
  rssSources: [
    {
      name: '36氪',
      url: 'https://36kr.com/feed',
      keywords: ['科技', 'AI', '汽车', '电池', '电动车', '人工智能', '芯片', '新能源', '固态电池'],
    },
    {
      name: '爱范儿',
      url: 'https://www.ifairer.com/feed',
      keywords: ['科技', 'AI', '汽车', '电池', '电动车', '人工智能'],
    },
    {
      name: '钛媒体',
      url: 'https://www.tmtpost.com/rss',
      keywords: ['科技', 'AI', '汽车', '电池', '电动车', '人工智能'],
    },
    {
      name: '爱尖刀',
      url: 'https://www.ijiandao.com/feed',
      keywords: ['科技', 'AI', '汽车'],
    },
  ],

  // 生成配置
  generation: {
    temperature: 0.7,
    maxArticlesPerRun: 3,  // 每次最多处理3篇
  },

  // 过滤关键词（含任意一个则跳过）
  blockKeywords: [
    '习近平', '国家领导人', '敏感人物',
  ],

  // 采集间隔（毫秒），默认30分钟
  collectInterval: 30 * 60 * 1000,
};
