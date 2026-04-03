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

  // RSS 订阅源（科技/AI/汽车 + Agent/AI开发）
  rssSources: [
    {
      name: '36氪',
      url: 'https://36kr.com/feed',
      keywords: [
        '科技', 'AI', '汽车', '电池', '电动车', '人工智能', '芯片', '新能源', '固态电池',
        'Agent', '大模型', 'LLM', 'MCP', 'Claude Code', 'Copilot', 'SWE-agent', 'OpenHands',
        'LangGraph', 'CrewAI', '推理优化', '长上下文', 'MoE', 'CLI Agent', 'Coding Agent',
        '固态电池', '闪充', '新车发布', '新能源',
      ],
    },
    {
      name: '虎嗅',
      url: 'https://www.huxiu.com/rss',
      keywords: [
        '科技', 'AI', '汽车', '电池', '电动车', '人工智能',
        'Agent', '大模型', 'LLM', 'MCP', 'Claude Code', 'Copilot', 'SWE-agent', 'OpenHands',
        'LangGraph', 'CrewAI', '推理优化', '长上下文', 'MoE', 'CLI Agent', 'Coding Agent',
      ],
    },
    {
      name: '钛媒体',
      url: 'https://www.tmtpost.com/rss',
      keywords: [
        '科技', 'AI', '汽车', '电池', '电动车', '人工智能',
        'Agent', '大模型', 'LLM', 'MCP', 'Claude Code', 'Copilot', 'SWE-agent', 'OpenHands',
        'LangGraph', 'CrewAI', '推理优化', '长上下文', 'MoE', 'CLI Agent', 'Coding Agent',
      ],
    },
    {
      name: 'AI Blog',
      url: 'https://arxiv.org/rss/cs.AI',
      keywords: [
        'Agent', 'LLM', 'language model', 'inference', 'reasoning', 'context window', 'MoE',
        'Claude', 'Gemini', 'OpenAI', 'Anthropic', 'Google DeepMind', 'SWE', 'coding agent',
      ],
    },
  ],

  // Agent/AI开发新增覆盖主题（Tavily搜索关键词，用于补充RSS覆盖不到的深度内容）
  agentTopics: [
    // CLI Agent
    'Claude Code CLI Agent architecture',
    'Gemini CLI terminal agent coding',
    // Coding Agent
    'Copilot Coding Agent SWE-agent OpenHands',
    'AI software engineering agent 2025',
    // LLM 底层
    'LLM inference optimization long context 2025',
    'Mixture of Experts MoE model efficiency',
    // MCP 协议
    'MCP Model Context Protocol Anthropic tool use',
    'MCP vs Function Calling comparison',
    // Agent 框架
    'LangGraph CrewAI multi-agent collaboration',
    'AI agent framework orchestration 2025',
    // OpenClaw
    'OpenClaw AI assistant architecture skill system',
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
