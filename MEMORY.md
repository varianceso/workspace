# MEMORY.md - 长期记忆

---

## 博客仓库

- **blog** (https://github.com/varianceso/blog) - Hexo 博客
- **blog-next** (https://github.com/varianceso/blog-next) - Next.js + Notion 博客（当前线上运行版本）

### 服务器部署信息

- **域名**: https://www.xiaoyaoyunchu.cloud (已备案)
- **服务器 IP**: 106.54.17.31
- **SSH**: `ssh root@106.54.17.31`

---

## 新闻机器人（news-bot）

### 最新结构（2026-03-31）
- **文章格式**：严格四段式
  1. 【标题】一句话概括，吸人眼球
  2. 【新闻】核心内容摘录，标注来源+时间
  3. 【思考】300-500字，带观点，分段叙述
  4. 【相关阅读】原文链接
- **Notion 数据库**：`708e7d5dd9cf43bb963ff5198ff4c1e3`（干净库，无多数据源限制）
- **Cron**：早中晚三次（8/12/18点）`/etc/cron.d/news-bot`
- **运行命令**：`bash /root/run-news-bot.sh`

### 关键文件
- `generator.js` - 生成文章（MiniMax API）
- `publisher.js` - 发布到 Notion（分块结构）
- `collector.js` - RSS 采集
- `db.js` - SQLite 追踪已发布
- `main.js` - 主入口

### RSS 源
- 36氪、爱范儿、钛媒体（正常）
- 爱尖刀（404 已报异常）

### GitHub Secret 事件（2026-03-31）
- 旧 commit `fd3f17f` 含 Notion Token 被 GitHub Secret Scanning 拦截
- 解决方案：重建干净历史（filter-branch），强制 push
- Token 已从历史中抹除，仓库现在干净

---

## 技术要点

- Next.js standalone 模式更稳定
- Notion API 分页需用 start_cursor 参数
- 服务器内存不足时先停服务再构建
- `TSC=false NEXT_TSC_IGNORE=true npm run build` 低内存构建

---

## API 配置

- **Notion**: `~/.config/notion/api_key`（ntn_xxx，已更新）
- **Tavily**: `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`
- **SiliconFlow**: `sk-pmmdusayxmtdhagcatprsakxvckfytdhidjsvhyighwmvpnv`
- **MiniMax** (Token Plan): `~/.config/notion/api_key` 里存 sk-cp-xxx

---

## 用户偏好

- 宇哥关注：科技前沿 / 汽车（固态电池/闪充/新能源） / AI 最新消息
- 价格标签：融资金额、产品售价必须标注
- 写作平台：Notion
- 写作风格：有观点有态度，不水文

---

## 记忆维护约定

- 每天聊天后更新当天记忆 (`memory/YYYY-MM-DD.md`)
- 每7天汇总到 MEMORY.md，删除旧日记录
- HEARTBEAT.md 是维护机制的执行文件
