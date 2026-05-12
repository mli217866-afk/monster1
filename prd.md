# 提示词精选社区 - 产品需求文档（PRD）

> **版本**：v0.5（草稿）
> **状态**：MVP 规划中
> **最后更新**：2026-05-11

---

## 0. 文档说明

本 PRD 仅覆盖 **MVP（P0）** 阶段。P1、P2 仅列功能清单，详细设计在对应版本启动时再补。

文档中标 `【待定】` 的内容是当前未确认、需要后续补充的部分，不影响 P0 开发推进。

---

## 1. 产品概述

### 1.1 一句话定位

面向中文 AI 用户的**精选**提示词分享社区。每条提示词都附带效果图与适用模型标记，强调"看得见效果、复制就能用"。

### 1.2 产品理念

- **质量 > 数量**：宁可少而精，不要多而杂。和市面上"提示词大全"类站点的最大区别就是**精选**。
- **视觉先行**：浏览体验以效果图为主，文字为辅。
- **复制即用**：核心动作是"复制提示词"，不是"阅读教程"。
- **中文友好**：界面、搜索、内容运营均面向中文用户。

### 1.3 目标用户

- AI 重度使用者：日常使用 ChatGPT / Claude / Midjourney / Sora / 即梦 / 可灵 等工具
- 内容创作者：自媒体、设计师、独立开发者，需要快速找到"能用的提示词"
- 学习者：想学怎么写提示词的新手，靠看高质量样例上手

### 1.4 不做什么（边界）

为了避免范围蔓延，明确以下事情**不做**：

- ❌ 不做提示词生成器（用户输入需求 → AI 帮你写提示词）
- ❌ 不做在线生图（不调用图像生成 API）
- ❌ 不做模型对比 / 评测
- ❌ MVP 阶段不做付费功能、不做创作者激励金

### 1.5 商业模式（当前阶段）

**完全免费，限速防滥用，先做流量。** 变现方式留到 P2 阶段，根据数据再定。

### 1.6 参考标杆

【待定 - 用户后续提供国内具体参考产品】

当前默认参考：

- 浏览体验：PromptHero（瀑布流、按模型筛选）
- 创作者机制：Civitai（创作者主页、作品归属）
- 中文社区氛围：小红书的卡片式 Feed

---

## 2. 技术栈与架构

### 2.1 技术栈总览

本项目基于 **mkfast-template / TanStarter** 全栈模板搭建，所有前端、SSR、服务端函数、API、Webhook 都在同一代码仓库内，最终部署到 **Cloudflare Workers**。

| 类别 | 选型 | 说明 |
|---|---|---|
| 前端框架 | React 19.2 | UI 渲染 |
| 全栈框架 | TanStack Start 1.132 | SSR + 服务端函数 + 文件路由 |
| 路由 | TanStack Router 1.132 | 文件路由（`src/routes`） |
| 构建工具 | Vite 7.1 | 开发与打包 |
| 语言 | TypeScript 5.7 | 全栈类型安全 |
| 包管理 | pnpm 10.30 | 强制使用 pnpm |
| 部署平台 | Cloudflare Workers | 边缘运行，非 Node.js |
| 数据库 | Cloudflare D1（SQLite）| 主存储 |
| ORM | Drizzle ORM 0.45 + drizzle-kit | 迁移在 `src/db/migrations` |
| 对象存储 | Cloudflare R2 | 绑定名 `BUCKET`，用于效果图 |
| 认证 | better-auth 1.4 | 邮箱密码 + Google OAuth |
| UI 组件 | shadcn 风格 + Base UI / Radix Slot | 在 `src/components/ui` |
| 样式 | Tailwind CSS 4.1 | 支持 dark / light |
| 图标 | @tabler/icons-react | - |
| 表单 | react-hook-form + zod | 校验统一走 zod |
| 服务端状态 | TanStack Query 5.66 | 客户端缓存 |
| 服务端函数 | `createServerFn()` | TanStack Start 提供 |
| 邮件 | Resend + React Email | 模板在 `src/mail` |
| 内容（博客等）| @content-collections | Markdown，目录 `content` |
| Lint / Format | Biome 2.3 | 2 空格、单引号、80 字符行宽 |
| 未用依赖检查 | knip | - |

### 2.2 必须遵守的运行环境约束

**核心约束：运行在 Cloudflare Workers，不是 Node.js Server。** 所有设计必须遵守以下限制：

- ❌ **没有本地文件系统**：所有文件读写走 R2
- ❌ **没有常驻进程**：不能在内存里维护长生命周期对象（如长连接 WebSocket 服务、内存定时器）
- ❌ **没有 Node.js 原生模块**：禁用 fs / child_process / net 等
- ⏱️ **单次请求 CPU 时间有限**：重计算任务必须异步化（拆到 Queue / Cron Trigger）
- 📦 **包体积有上限**：避免引入过大依赖

定时任务、异步任务的标准做法：

- **定时任务**：使用 Cloudflare **Cron Triggers**（在 `wrangler.jsonc` 配置）
- **异步处理**：使用 Cloudflare **Queues**
- **临时状态 / 计数器**：使用 Cloudflare **KV**（最终一致性，适合 view_count 之类）
- **强一致性数据**：使用 D1

### 2.3 目录结构约定

新增功能时遵循模板已有的目录划分：

```
src/
├── routes/                 文件路由（页面 + API）
│   ├── index.tsx           首页
│   ├── prompt/             提示词相关路由
│   │   └── $id.tsx         详情页（动态路由）
│   ├── tag/
│   │   └── $slug.tsx       标签聚合页
│   ├── search.tsx          搜索结果页
│   ├── me/                 个人中心
│   ├── admin/              管理后台
│   └── api/                API + Webhook
│       └── prompts/        提示词相关 API
├── components/
│   ├── ui/                 shadcn 基础组件（不要乱改）
│   ├── prompt/             提示词卡片、详情组件
│   ├── filter/             模型筛选、标签筛选组件
│   └── layout/             导航栏、底部等布局
├── api/                    业务 API 逻辑（serverFn 集中处理）
│   ├── prompts.ts
│   ├── collections.ts
│   ├── likes.ts
│   └── search.ts
├── db/
│   ├── auth.schema.ts      better-auth 表（不要动）
│   ├── app.schema.ts       业务表（新增表写这里）
│   └── migrations/
├── auth/                   better-auth 配置
├── storage/                R2 封装
├── mail/                   邮件模板
├── config/
│   └── website.ts          站点配置（站名、价格、主题等）
└── server.ts               Cloudflare Worker 入口
```

### 2.4 关键功能的技术实现要点

| 功能 | 技术实现 |
|---|---|
| 首页瀑布流 SSR | TanStack Start 路由 + loader 在边缘节点预取数据 |
| 详情页 SEO | TanStack Start SSR + 路由 meta 函数动态生成 title / description / OG |
| 注册登录 | better-auth（模板已配好，无需开发） |
| 邮件发送 | Resend + 模板已有的 React Email |
| 图片上传 | 前端直传 R2（走预签名 URL）或经服务端转发，限 5MB |
| 图片压缩 / 缩略图 | Cloudflare Images（推荐）或前端上传前压缩 |
| 搜索（P0）| Drizzle + D1 的 LIKE 查询 |
| 限速 | Cloudflare 内置 Rate Limiting API |
| 复制次数等高频计数 | KV 累加 + Cron Trigger 定期合并到 D1 |
| sitemap.xml | 一个路由 `routes/sitemap[.]xml.ts` 动态生成 |
| OG 图自动生成 | 边缘运行的图片合成（用 @vercel/og 或类似 worker 兼容方案）|

### 2.5 当前模板暂不使用的能力

模板内置了支付、AI、Newsletter 等能力，**P0 阶段先不启用**，但保留依赖避免重复配置：

- 支付（Stripe / Creem）：P0 无付费功能
- TanStack AI（@tanstack/ai 系列）：P1 / P2 可能用于提示词翻译、润色
- Newsletter（Resend / Beehiiv）：P1 上线
- Discord / Feishu 通知：可在 P0 接管理员关键事件通知（如新内容发布告警），优先级低

---

## 3. 核心概念与数据模型

### 3.1 核心概念

| 概念 | 说明 |
|---|---|
| **Prompt（提示词条目）** | 平台最小内容单元，包含文本、效果图、模型标签、分类标签等 |
| **Model（模型）** | 提示词适用的 AI 模型（GPT-4 / Claude / Midjourney / Sora / 即梦等） |
| **Tag（标签）** | 提示词的分类与主题标签（如「人像」「赛博朋克」「写作」） |
| **Collection（收藏夹）** | 用户的私人收藏分组，把感兴趣的提示词归类保存 |
| **Like（点赞）** | 用户对提示词的简单认可 |
| **User（用户）** | 注册用户，可登录、点赞、收藏 |

### 3.2 Prompt 的字段定义

一条 Prompt 必须包含：

- **标题**（中文，必填）
- **提示词文本**（核心字段，必填，支持长文本）
- **适用模型**（从预设模型列表中选择，必填，可多选）
- **效果图**（至少 1 张，最多 4 张）
- **简介**（一句话说明这条提示词能做什么，必填）
- **分类标签**（必填，至少 1 个）
- **来源标注**（可选，如转载需注明原作者/链接）
- **作者**（系统记录，发布者）
- **状态**（草稿 / 待审核 / 已发布 / 已下架）
- **统计**（浏览数、点赞数、收藏数、复制数）

### 3.3 模型列表（初版）

P0 内置以下模型分类，后续可在管理后台扩展：

- **文本类**：GPT-4 / GPT-5 / Claude / Gemini / DeepSeek / 通义千问 / Kimi
- **生图类**：Midjourney / Stable Diffusion / Flux / 即梦 / 可灵图像 / Nano Banana
- **视频类**：Sora / 可灵 / 即梦视频 / Runway
- **其他**：留扩展位

> 说明：模型列表会快速变化，必须做成可在管理后台动态维护，不能写死在代码里。

---

## 4. P0（MVP）功能范围

### 4.1 功能清单总览

| 模块 | 功能 | 优先级 |
|---|---|---|
| 浏览端 | 首页瀑布流 | P0 |
| 浏览端 | 按模型筛选 | P0 |
| 浏览端 | 按标签筛选 | P0 |
| 浏览端 | 关键词搜索 | P0 |
| 浏览端 | 提示词详情页 | P0 |
| 浏览端 | 一键复制提示词 | P0 |
| 用户端 | 注册 / 登录（邮箱 + Google） | P0 |
| 用户端 | 点赞 | P0 |
| 用户端 | 收藏到收藏夹 | P0 |
| 用户端 | 个人收藏夹管理 | P0 |
| 内容端 | 管理员后台录入提示词 | P0 |
| 内容端 | 管理员后台维护模型/标签 | P0 |
| SEO | 详情页 SSR + 独立 URL | P0 |
| SEO | sitemap / OG 图 | P0 |
| 基础 | 限速（防爬虫和滥用） | P0 |

### 4.2 功能详细描述

#### 4.2.1 首页瀑布流

**目标**：用户进入首页第一眼看到的就是"高质量内容"，激发浏览欲望。

**布局**：

- 桌面端：3–4 列瀑布流，卡片宽度自适应
- 移动端：2 列瀑布流
- 卡片内容：效果图（首图）+ 标题 + 适用模型小图标 + 点赞数

**排序逻辑（默认）**：

- 默认排序：综合热度（点赞数 × 时间衰减 + 新内容加权）
- 可切换：最新发布 / 最多点赞 / 最多收藏

**加载方式**：

- 无限滚动加载（首屏 20 条，每次加载 20 条）
- 移动端考虑改为"加载更多"按钮，避免无限滚动遮挡底部

**技术实现**：

- **路由**：`src/routes/index.tsx`，使用 TanStack Router 的 `createFileRoute()`
- **数据获取**：路由 `loader` 函数中调用 `getPromptsList()` serverFn，返回首屏 20 条
- **SSR**：TanStack Start 自动 SSR，首屏数据随 HTML 一起返回（关键，影响 SEO 和 LCP）
- **无限滚动**：客户端用 TanStack Query 的 `useInfiniteQuery`，调用同一个 serverFn 的分页接口
- **API 设计**：`getPromptsList({ cursor?, model?, sort?, limit=20 })` 使用 cursor 分页（基于 `published_at + id`），避免 D1 上 OFFSET 大数据集的性能问题
- **缓存策略**：
  - 边缘缓存：首页（无筛选）走 Cloudflare Cache，TTL 5 分钟
  - 客户端：TanStack Query `staleTime: 60_000`
- **瀑布流布局**：CSS `columns` 实现（最简单），或 `react-masonry-css`
- **图片**：使用 Cloudflare Images 自动 WebP / AVIF + 响应式 `srcset`，配合 `loading="lazy"`

#### 4.2.2 按模型筛选

**入口**：首页顶部一排模型 Logo / 名称按钮，单选。

**交互**：

- 默认"全部"
- 选中某个模型（如"Midjourney"）后，瀑布流只显示该模型的提示词
- URL 带参数（如 `/?model=midjourney`），方便分享和 SEO

**技术实现**：

- **URL 同步**：通过 TanStack Router 的 `search` 参数（如 `?model=midjourney`），用 `zod` 校验 schema
- **筛选逻辑**：在 `getPromptsList()` serverFn 内通过 `prompt_models` 关联表 JOIN 过滤
- **查询优化**：建复合索引 `prompt_models(model_id, prompt_id)`，配合 `prompts(status, published_at)`
- **客户端态**：Tab 选中状态由 URL 派生（不存 React state），方便分享 URL 和刷新还原
- **SEO**：每个模型聚合页有独立 title / description / canonical（如"Midjourney 精选提示词 - 站名"）

#### 4.2.3 按标签筛选

**入口**：

- 首页二级筛选区（在模型筛选下方），显示当前热门标签
- 详情页底部的标签可点击跳转到该标签聚合页

**交互**：

- 标签聚合页 URL：`/tag/{tag-slug}`
- 标签可与模型筛选组合使用

**技术实现**：

- **路由**：`src/routes/tag/$slug.tsx`，slug 走数据库 `tags.slug` 字段
- **数据获取**：loader 中 JOIN `prompt_tags` 过滤，复用 `getPromptsList()` 加 tag 参数
- **热门标签**：从 `tags` 表 `usage_count desc` 取 Top N，该字段由 Cron Trigger 每天聚合一次（不要每次写提示词都更新，会扛不住 D1 写入）
- **404 处理**：slug 不存在时返回 404，避免被恶意爬出无限路径

#### 4.2.4 关键词搜索

**入口**：顶部导航栏的搜索框

**搜索范围**：标题 + 简介 + 提示词文本 + 标签

**实现方式（P0 简化版）**：

- D1 是 SQLite，原生 LIKE 即可满足初期数据量（< 1 万条）
- 不上 ElasticSearch 等重型方案，等量级真上来再升级
- 注意：D1 / SQLite 中文分词较弱，初期可以接受"模糊匹配"的体验
- 可选优化：建一个搜索专用字段，把标题+简介+标签拼接好做匹配

**结果页**：

- URL：`/search?q={keyword}`
- 复用瀑布流 UI

**技术实现**：

- **路由**：`src/routes/search.tsx`，URL `?q={keyword}`
- **搜索实现（P0）**：
  - 用 Drizzle 的 `like` 查询：`title LIKE %q% OR description LIKE %q% OR content LIKE %q%`
  - 增加一个冗余字段 `search_text`（title + description + 标签名 拼接），只查这一个字段，简化逻辑
  - 注意 SQL 注入防护：Drizzle 参数化查询天然安全，但要避免手拼 SQL
- **中文分词的妥协**：D1 / SQLite 原生 FTS5 对中文支持差，P0 不上分词，依赖 LIKE 的子串匹配
- **限速**：搜索接口走 §4.2.14 限速（30 次/分钟）
- **空结果优化**：返回热门标签和"试试这些关键词"引导
- **未来升级路径**：数据量 > 1 万条或搜索体验明显下降时，考虑接 Cloudflare Vectorize（向量检索）或外部搜索服务

#### 4.2.5 提示词详情页

**URL 结构**：`/prompt/{id}-{slug}`（兼顾 SEO）

**页面区块**（从上到下）：

1. **效果图区**：大图轮播（最多 4 张），点击可放大查看原图
2. **标题 + 作者 + 发布时间**
3. **适用模型标签**：醒目展示
4. **分类标签**
5. **提示词文本区**：
   - 灰色背景代码块样式（强调"可复制"）
   - 右上角"一键复制"按钮（核心动作，需要明显）
   - 复制成功后 toast 提示
6. **简介 / 使用说明**
7. **互动区**：点赞、收藏（未登录引导登录）
8. **来源标注**（如有）
9. **相关推荐**：同模型 / 同标签的其他提示词，6–8 条

**SEO 要点**：

- 使用 SSR（TanStack Start 原生支持）
- title / description 动态生成
- OG 图：用首张效果图 + 标题合成
- 结构化数据：`Article` 或 `CreativeWork` schema

**技术实现**：

- **路由**：`src/routes/prompt/$id.tsx`，URL 形如 `/prompt/123-cyber-girl-portrait`
- **slug 处理**：
  - 入参实际是 `{id}-{slug}`，路由 loader 里拆出 id 查询
  - 如果 slug 和数据库不匹配，301 重定向到正确的 slug（防止旧链接和拼写错误）
- **SSR + meta**：
  - 路由的 `head()` 函数返回 title / description / OG 标签
  - OG 图：构造 URL 形如 `/og/prompt/{id}.png`，由独立路由动态生成（用 `@vercel/og` 或 `workers-og`，都兼容 Workers）
  - 结构化数据（JSON-LD）：使用 `CreativeWork` schema
- **数据获取**：loader 一次性查出 prompt + 图片 + 标签 + 模型 + 作者
- **相关推荐**：
  - 简单实现：同模型 + 同主标签的其他提示词，按热度排序取 6-8 条
  - 注意排除当前提示词本身
- **浏览数统计**：
  - 不走 D1（写入压力大），写入 Cloudflare KV
  - Cron Trigger 每 10 分钟把 KV 累加值合并回 `prompts.view_count`
- **图片轮播**：用轻量库或自实现，懒加载非首图

#### 4.2.6 一键复制提示词

**触发**：详情页"复制"按钮、卡片上的快捷复制按钮（hover 出现）

**行为**：

- 复制提示词文本到剪贴板
- toast 反馈"已复制"
- 后端记录复制次数（统计哪些提示词最受欢迎，作为后续运营依据）

**注意**：复制次数统计要做防刷（同 IP / 同用户短时间内多次复制只记一次）。

**技术实现**：

- **前端复制**：使用 `navigator.clipboard.writeText()`（现代浏览器支持），降级方案用 `document.execCommand('copy')`
- **微信内置浏览器兼容**：clipboard API 有限制，必要时用 `react-use` 的 `useCopyToClipboard` hook
- **复制成功反馈**：sonner toast（模板已有）+ 按钮短暂变为"已复制 ✓"
- **复制次数统计**：
  - 调用 `/api/prompts/{id}/copy` 接口（serverFn 或专门的 API 路由）
  - 写入 KV（避免 D1 高频写入），Cron Trigger 定期合并
  - 防刷：同 IP + 同 prompt_id 在 KV 加 5 分钟 TTL，TTL 内不重复计数
- **不阻塞 UI**：复制和统计上报异步进行，复制失败也不影响用户体验

#### 4.2.7 注册 / 登录

**方式**：

- 邮箱 + 密码
- Google OAuth

**触发时机**：

- 用户点击点赞 / 收藏时，弹出登录引导（不强制）
- 浏览、搜索、复制无需登录（降低使用门槛）

**实现**：使用模板已有的 better-auth，不需要额外开发。

**技术实现**：

- **完全复用模板**：模板已配好 better-auth，路由 `src/routes/auth/*` 已有 login / register / forgot / reset
- **Google OAuth**：在 `src/auth/auth.ts` 启用 Google provider，配置 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`（Cloudflare Workers secrets）
- **会话存储**：better-auth 默认存到 D1 的 `session` 表
- **登录引导**：未登录用户点击点赞 / 收藏时，前端弹出登录 Dialog（不跳转，保留上下文）
- **登录后回跳**：URL 带 `?redirect=/prompt/123-xxx`，登录成功后回到原页
- **邮件验证 / 密码重置邮件**：通过 Resend 发送（模板已配），邮件模板在 `src/mail`

#### 4.2.8 点赞

- 已登录用户对提示词点赞 / 取消点赞
- 同一用户对同一提示词只能点赞一次
- 实时更新点赞数显示

**技术实现**：

- **接口**：`POST /api/prompts/{id}/like` 切换点赞状态（toggle）
- **认证**：auth middleware 拦截，未登录返回 401
- **数据**：`likes` 表插入或删除一行
- **乐观更新**：前端用 TanStack Query 的 `useMutation` + `onMutate` 立刻更新 UI，失败回滚
- **计数字段**：
  - `prompts.like_count` 不实时更新（D1 写入压力）
  - 每次 like 操作除了写 `likes` 表，还在 KV 里 +1 / -1
  - Cron Trigger 定期合并到 `prompts.like_count`
- **防刷**：同用户同 prompt 由数据库唯一约束 `(user_id, prompt_id)` 保证幂等

#### 4.2.9 收藏到收藏夹

**收藏夹机制**：

- 每个用户有一个默认收藏夹"我的收藏"
- 用户可创建自定义收藏夹（如"写作类""绘画类"）
- 一条提示词可同时收藏到多个收藏夹

**交互**：

- 详情页点击"收藏"按钮 → 弹出收藏夹选择器
- 卡片 hover 时也可显示收藏快捷按钮

**技术实现**：

- **接口**：
  - `GET /api/me/collections`：列出当前用户的收藏夹
  - `POST /api/me/collections/{id}/items`：添加到收藏夹
  - `DELETE /api/me/collections/{id}/items/{prompt_id}`：从收藏夹移除
- **新用户初始化**：注册成功后（better-auth 的 hook 里）自动创建一个默认收藏夹 `is_default = true`
- **交互**：详情页点击"收藏" → 弹出 Popover 列出所有收藏夹（带 checkbox）→ 提交时批量同步
- **UI 组件**：复用 shadcn 的 Popover + Checkbox
- **乐观更新**：同点赞，UI 即时反馈

#### 4.2.10 个人收藏夹管理

**入口**：用户头像下拉菜单 → "我的收藏"

**页面**（`/me/collections`）：

- 列出所有收藏夹（默认夹 + 自定义夹）
- 可新建、重命名、删除收藏夹（默认夹不可删）
- 点击收藏夹进入详情页（`/me/collections/{id}`）
- 收藏夹详情页：瀑布流展示该夹内的提示词，可移除

**注意**：收藏夹本身在 P0 阶段**不公开**（不做"分享我的收藏夹"功能），P1 再考虑。

**技术实现**：

- **路由**：
  - `src/routes/me/collections/index.tsx`：收藏夹列表
  - `src/routes/me/collections/$id.tsx`：单个收藏夹详情
- **认证**：路由 loader 中检查登录态，未登录重定向到 `/auth/login?redirect=...`
- **默认收藏夹保护**：`is_default = true` 的不允许删除（前后端都加校验）
- **空状态**：新用户的收藏夹为空时，引导浏览首页发现内容

#### 4.2.11 管理员后台 - 录入提示词

**入口**：复用模板已有的 admin 后台，新增"提示词管理"模块

**功能**：

- 列表页：所有提示词（含草稿、已发布、已下架），可筛选状态
- 编辑页：富文本/Markdown 编辑提示词内容、上传效果图（走 R2）、选择模型/标签、设置状态
- 批量操作：批量发布、批量下架

**字段**：见 §3.2

**效果图上传**：

- 走模板已有的 R2 存储
- 上传时自动压缩并生成不同尺寸（缩略图、详情图）
- 限制：单图不超过 5MB，单条最多 4 张

**技术实现**：

- **路由**：
  - `src/routes/admin/prompts/index.tsx`：列表
  - `src/routes/admin/prompts/new.tsx`：新建
  - `src/routes/admin/prompts/$id/edit.tsx`：编辑
- **权限**：admin middleware（模板已有，基于 better-auth role），非 admin 返回 403
- **表单**：react-hook-form + zod 校验
- **富文本 / Markdown**：提示词正文用普通 textarea 即可（用户复制后是纯文本），简介支持 Markdown
- **图片上传**：
  - 走 R2 直传：前端请求服务端拿预签名 URL → 直接 PUT 到 R2 → 上传完拿到 key 存数据库
  - 限制：单图 5MB，单条最多 4 张，前端用 zod 校验
  - 不在 Worker 内做图片压缩（CPU 限制）：靠 Cloudflare Images 自动生成不同尺寸，或前端用 `browser-image-compression` 上传前压
- **状态机**：draft → review → published → archived，UI 上做状态切换按钮
- **批量操作**：勾选多条 → 批量发布 / 下架 / 删除，通过 SQL `IN (...)` 实现

#### 4.2.12 管理员后台 - 模型 / 标签维护

**模型管理**：

- 列出所有模型
- 新建、编辑（图标、名称、描述、所属类别）、启用/停用
- 调整显示顺序

**标签管理**：

- 列出所有标签
- 新建、编辑（名称、slug、描述）、合并、删除
- 标签按使用次数排序

**技术实现**：

- **路由**：`src/routes/admin/models.tsx`、`src/routes/admin/tags.tsx`
- **CRUD**：标准 Drizzle + serverFn，注意：
  - 模型删除：先检查是否被 prompt 引用，被引用时禁止删除（提示"先解绑"）或软删除
  - 标签合并：把 `prompt_tags` 表中的 `tag_id` 批量替换，然后删旧标签（事务执行）
- **slug 自动生成**：用 `pinyin-pro` 把中文转拼音生成 slug（在 admin 服务端运行，npm 包兼容 Workers）
- **图标上传**：模型 icon 走 R2，URL 存 `models.icon_url`

#### 4.2.13 SEO 基础

**必须做**：

- 所有详情页 SSR
- 每个详情页独立 URL，URL 含中文 slug 转拼音
- 自动生成 sitemap.xml
- robots.txt 配置
- 详情页 OG 图自动生成（首张效果图 + 标题文字叠加）
- 结构化数据（JSON-LD）
- 首页、模型聚合页、标签聚合页的 title / description 模板化

**技术实现**：

- **sitemap**：
  - 路由 `src/routes/sitemap[.]xml.ts`（文件名中的 `[.]` 是 TanStack Router 的转义写法）
  - 服务端查询所有 `status = published` 的 prompt，输出 XML
  - 数据量大时分片：`sitemap-index.xml` + 多个 `sitemap-N.xml`，每片 ≤ 5 万 URL
  - 用 Cloudflare Cache 缓存 6 小时
- **robots.txt**：静态文件放 `public/robots.txt`，禁止抓取 `/admin/*` `/me/*` `/api/*`
- **OG 图自动生成**：
  - 路由 `src/routes/og/prompt/$id[.]png.ts`
  - 用 `@vercel/og` 或 `workers-og`，把首张效果图 + 标题文字合成
  - 缓存：Cloudflare Cache TTL 7 天，URL 带版本参数（更新提示词时换参数失效缓存）
- **结构化数据**：详情页 head 注入 JSON-LD `<script type="application/ld+json">`
- **canonical**：每个公开页面输出 `<link rel="canonical">`，避免重复内容惩罚

#### 4.2.14 限速（基础防滥用）

**场景**：

- 未登录用户：浏览页 60 次/分钟
- 搜索接口：30 次/分钟
- 复制接口：20 次/分钟
- 登录 / 注册接口：10 次/分钟
- 同 IP 注册：5 次/天

**实现**：

- Cloudflare Workers 自带的 Rate Limiting API，或用 D1 / KV 自实现
- 触发限速后返回 429 状态码 + 友好提示

---

**技术实现**：

- **方案**：使用 Cloudflare Workers 内置的 Rate Limiting API（在 `wrangler.jsonc` 中声明 binding）
- **维度**：
  - 未登录用户：用 IP 限速
  - 已登录用户：用 user_id 限速
- **登录 / 注册接口单独配置**：避免暴力破解
- **触发后**：返回 429 + JSON `{ error: 'rate_limited', retry_after: 60 }`
- **绕过**：admin 用户登录后白名单
- **观测**：限速触发事件打 Workers logs，便于发现异常爬虫
- **可选增强**：高频接口加 Cloudflare Turnstile（无感人机校验），未登录用户在搜索 / 复制等场景按需触发

## 5. 信息架构与页面清单

### 5.1 路由总览

```
/                          首页（瀑布流）
/?model=xxx                按模型筛选
/tag/{slug}                标签聚合页
/search?q=xxx              搜索结果页
/prompt/{id}-{slug}        提示词详情页

/auth/login                登录
/auth/register             注册
/auth/forgot-password      忘记密码
/auth/reset-password       重置密码

/me                        我的主页（重定向到 /me/collections）
/me/collections            我的收藏夹列表
/me/collections/{id}       某个收藏夹详情
/me/settings               账户设置（复用模板已有页面）

/admin                     管理员后台（复用模板）
/admin/prompts             提示词管理
/admin/prompts/new         新建提示词
/admin/prompts/{id}/edit   编辑提示词
/admin/models              模型管理
/admin/tags                标签管理
/admin/users               用户管理（复用模板已有）

/about                     关于我们
/legal/privacy             隐私政策（复用模板）
/legal/terms               服务条款（复用模板）

/sitemap.xml               sitemap
/robots.txt                robots
```

### 5.2 导航结构

**顶部导航**：Logo / 搜索框 / 模型快捷入口 / 用户头像（或登录按钮）

**首页二级导航**：模型 Tabs / 排序切换 / 热门标签快捷入口

**用户菜单**（点击头像下拉）：我的收藏 / 账户设置 / 退出登录

---

## 6. 数据库设计（基于 D1 + Drizzle）

> 说明：模板已有 `auth.schema.ts`（认证表）和 `app.schema.ts`（业务表）。以下表全部加到 `app.schema.ts`。

### 6.1 表结构

```
prompts                   提示词主表
├── id (pk)
├── slug (unique)         URL 用，由标题转拼音
├── title                 标题
├── content               提示词正文
├── description           简介
├── source_url            来源链接（可选）
├── source_author         原作者（可选）
├── status                draft | review | published | archived
├── author_id (fk users)  发布者
├── view_count
├── like_count
├── collect_count
├── copy_count
├── created_at
├── updated_at
└── published_at

prompt_images             提示词效果图
├── id (pk)
├── prompt_id (fk)
├── url                   R2 上的图片地址
├── thumb_url             缩略图地址
├── width
├── height
├── sort_order
└── created_at

models                    模型字典
├── id (pk)
├── slug (unique)         如 midjourney
├── name                  显示名
├── icon_url
├── category              text | image | video | other
├── description
├── is_active
├── sort_order
└── created_at

prompt_models             提示词-模型 关联（多对多）
├── prompt_id (fk)
├── model_id (fk)
└── pk(prompt_id, model_id)

tags                      标签字典
├── id (pk)
├── slug (unique)
├── name
├── description
├── usage_count           使用次数（冗余字段，定期更新）
└── created_at

prompt_tags               提示词-标签 关联（多对多）
├── prompt_id (fk)
├── tag_id (fk)
└── pk(prompt_id, tag_id)

likes                     点赞
├── user_id (fk)
├── prompt_id (fk)
├── created_at
└── pk(user_id, prompt_id)

collections               收藏夹
├── id (pk)
├── user_id (fk)
├── name
├── is_default            是否是默认夹
├── sort_order
├── created_at
└── updated_at

collection_items          收藏夹条目
├── collection_id (fk)
├── prompt_id (fk)
├── created_at
└── pk(collection_id, prompt_id)
```

### 6.2 索引建议

- `prompts(status, published_at desc)`：首页瀑布流主查询
- `prompts(status, like_count desc)`：热门排序
- `prompts(slug)`：详情页查询
- `prompt_models(model_id, prompt_id)`：按模型筛选
- `prompt_tags(tag_id, prompt_id)`：按标签筛选
- `likes(prompt_id)`：点赞数统计
- `collection_items(collection_id, created_at desc)`：收藏夹列表

### 6.3 D1 / SQLite 注意事项

- D1 单库写入有 QPS 限制，统计字段（like_count、copy_count）的更新要做**异步聚合**，不要每次操作都写主表
- 对于 view_count 这类高频低价值数据，考虑用 KV 存储 + 定期合并到 D1
- 中文搜索：D1 不支持中文全文索引，P0 用 LIKE 凑合，量大后考虑外接搜索服务

---

## 7. 关键非功能需求

### 7.1 性能

- 首页 LCP < 2.5s（Cloudflare Workers 边缘节点 + SSR 缓存）
- 详情页 LCP < 2.5s
- 图片走 R2 + Cloudflare Images 优化（自动 WebP / AVIF）
- 首屏图片懒加载

### 7.2 SEO

- 所有公开页面 SSR
- sitemap 自动更新（每次发布提示词触发）
- 详情页支持自定义 meta（标题、描述、OG 图）
- URL 干净、稳定、不变（一旦发布 slug 不可改，避免 404）

### 7.3 安全

- 所有用户输入做 XSS 过滤（包括提示词文本展示）
- 后台登录走 admin middleware
- 防爬虫：限速 + UA 检查 + 必要时 Cloudflare Turnstile
- 上传图片做格式校验和 MIME 检查（防伪造）

### 7.4 合规（中文站特别注意）

- ICP 备案（如果使用国内域名/CDN）
- 用户协议、隐私政策必须有
- 内容举报通道（即使 P0 用户不能直接发提示词，也要有举报链接）
- 留好"违法信息处理"的开关（敏感词过滤、人工下架接口）

### 7.5 可观测性

- Cloudflare Workers 自带的 logs 和 analytics
- 关键事件埋点：注册、登录、点赞、收藏、复制、搜索
- 错误上报：考虑接 Sentry（可选）

---

## 8. 验收标准（P0 上线门槛）

P0 阶段满足以下条件即可上线：

- [ ] 首页瀑布流可正常浏览，移动端体验通过
- [ ] 至少 3 种模型筛选可用，至少 50 条已发布提示词作为冷启动内容
- [ ] 详情页 SEO 三件套（title / description / OG 图）完备
- [ ] 复制按钮在主流浏览器（Chrome / Safari / 微信内置浏览器）可用
- [ ] 注册 / 登录 / 点赞 / 收藏 流程跑通
- [ ] 管理后台可独立完成新增 / 编辑 / 发布提示词的全流程
- [ ] 限速生效，未登录用户高频请求会被挡
- [ ] sitemap.xml 可访问、内容正确
- [ ] 隐私政策、服务条款页面已上线
- [ ] 通过 Lighthouse 性能 / SEO / 可访问性各项 > 85

---

## 9. 不在 P0 范围（P1 / P2 概览）

### 9.1 P1（上线后 1–2 个月）

- 用户提交提示词 + 审核流程（解决长期手动录入问题）
- 创作者主页（`/u/{username}`）
- 评论功能
- Newsletter（每周精选邮件，复用模板的 Resend）
- 收藏夹分享
- 提示词历史版本

### 9.2 P2（看数据决定）

- 关注创作者
- 通知系统（站内通知 + 邮件）
- AI 辅助：提示词翻译、提示词润色（复用模板的 TanStack AI）
- 付费墙：付费会员可查看全部提示词 / 高清图等
- 数据分析后台
- 多语言支持（如要做海外版）

---

## 10. 待定与未决问题

| 编号 | 内容 | 影响 | 负责人 / 时限 |
|---|---|---|---|
| Q1 | 国内具体参考标杆产品 | 影响首页布局、社区机制细节 | 用户后续提供 |
| Q2 | 冷启动内容方案（人工录入 vs KOL 入驻 vs 其他） | 影响上线后内容运营节奏 | 用户后续决定 |
| Q3 | 域名 / 备案 / 部署区域 | 影响合规和访问速度 | 待规划 |
| Q4 | 视觉设计风格（小红书风 vs Civitai 风 vs 其他） | 影响 UI 设计 | 待 Q1 后明确 |
| Q5 | 是否需要"匿名访客点赞 / 收藏"的体验降级 | 影响转化漏斗 | 上线后看数据 |

---

## 11. UI / 视觉设计指引

### 11.1 视觉风格基调

**整体风格：极简专业风（Linear / Vercel / Raycast 风格）**

- **克制**：信息密度低，留白充足，每个元素都有存在的理由
- **冷静**：不靠装饰元素堆砌"AI 感"，质量本身就是调性
- **聚焦内容**：UI 是配角，提示词内容和效果图是主角
- **专业**：让用户一眼觉得"这站靠谱、内容是精选的"

**反模式（明确不做）**：

- ❌ 不做霓虹、发光、玻璃拟态等"廉价 AI 风"
- ❌ 不用大面积渐变背景
- ❌ 不做粒子动画、鼠标跟随特效
- ❌ 不用花哨字体、奇怪间距

### 11.2 主题与颜色

**默认主题：亮色模式**

- 极简风更适合白底，深色作为可切换选项保留
- 中文用户白天浏览偏好亮色
- 切换按钮放在顶部导航右侧

**核心色板**：

| 用途 | 亮色 | 暗色 |
|---|---|---|
| 主背景 | `#FFFFFF` | `#0A0A0A` |
| 次级背景（卡片、面板） | `#FAFAFA` | `#141414` |
| 边框 | `#E5E5E5` | `#262626` |
| 主文本 | `#0A0A0A` | `#FAFAFA` |
| 次级文本 | `#737373` | `#A3A3A3` |
| 提示文本 | `#A3A3A3` | `#737373` |
| 主强调色 | `#000000`（黑色按钮） | `#FFFFFF`（白色按钮） |
| 辅助强调（可选） | `#3B82F6` 蓝 / `#8B5CF6` 紫 | 同左 |

**说明**：极简风不靠彩色出彩，主按钮就是纯黑/纯白。彩色只用于状态（成功绿、错误红、警告黄）和极少数辅助点缀（比如点赞图标）。Tailwind 自带的 `neutral` / `zinc` 色板可以直接用。

### 11.3 字体规范

| 用途 | 字体栈 |
|---|---|
| 中文主字体 | `"PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei", sans-serif` |
| 英文 / 数字 | `Inter, ui-sans-serif, system-ui, sans-serif` |
| 代码 / 提示词文本 | `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace` |
| 字重 | 仅用 400（常规）、500（强调）、600（标题），不用更粗的 |

**字号体系**（基于 Tailwind 默认）：

- 正文：`text-sm` (14px) — 主要 UI 文字
- 副文：`text-xs` (12px) — 元信息、次级标签
- 标题 H1：`text-3xl` (30px) — 详情页主标题
- 标题 H2：`text-xl` (20px) — 区块标题
- 标题 H3：`text-base` (16px) — 卡片标题
- 大数字：`text-2xl` (24px) — 统计数据

**不使用**：粗体大标题（>40px）、艺术字、英文 ALL CAPS（仅在小型 label 上偶尔可用，配 letter-spacing）

### 11.4 间距与圆角

- **基础单位**：4px 倍数（Tailwind 默认）
- **卡片内边距**：`p-4` (16px) 或 `p-5` (20px)
- **区块间距**：`gap-6` (24px) 或 `gap-8` (32px)
- **圆角**：`rounded-lg` (8px) 为主，按钮 `rounded-md` (6px)，头像 `rounded-full`
- **不用**：超大圆角（>12px）、不规则形状、斜切

### 11.5 阴影与边框

**极简风的核心原则：用边框，不用阴影**

- 卡片：1px 实线边框 + 无阴影
- 弹层 / Dialog：可用极轻阴影 `shadow-sm` 或 `shadow-md`
- 输入框 focus 态：用边框颜色变化，不用 outline 发光
- ❌ 不用霓虹边框、发光效果、彩色阴影

### 11.6 关键组件设计要点

#### 11.6.1 提示词卡片（瀑布流单元）

参考前面对比图中的 **C 方案**，具体要点：

- 整张卡片白底 + 1px 边框 + 无阴影
- 顶部：效果图，占卡片 55% 高度
- 中部：模型名（小字、大写、tracking-wider、灰色）
- 标题：`text-sm` `font-medium` 1-2 行（超出 ellipsis）
- 底部：复制数 · 点赞数（次级文本）
- Hover 效果：边框颜色加深 + 整卡微微上移 2px（用 `transform: translateY(-2px)` + 200ms 过渡）
- **不要 hover 显示遮罩、不要显示"快捷操作按钮"** — 极简风不需要

#### 11.6.2 提示词文本块（详情页核心）

这是用户**最想复制**的地方，要专门设计：

- 背景：`bg-neutral-50` / 暗色下 `bg-neutral-900`
- 字体：等宽字体（JetBrains Mono）
- 内边距：`p-5` 到 `p-6`
- 圆角：`rounded-lg`
- 右上角：复制按钮（图标 + "复制"文字），hover 整块文本块边框变化
- **整块可点击复制**（不只是按钮）
- 复制后：按钮短暂变成"已复制 ✓" 1.5 秒
- 长文本：默认折叠到 8 行，"展开全部"按钮

#### 11.6.3 模型筛选 Tabs

- 横向排列，桌面端不滚动（最多 6-8 个主模型）
- 选中：黑底白字（亮色模式）/ 白底黑字（暗色模式），`font-medium`
- 未选中：透明底 + 次级文字色
- 圆角 `rounded-md`，padding `px-3 py-1.5`
- 不放模型 logo（极简风不用），只用文字
- 模型多了横向滚动 + 渐变遮罩边缘

#### 11.6.4 按钮规范

- **主按钮**：纯黑底白字（亮色）/ 纯白底黑字（暗色），`rounded-md`
- **次按钮**：透明底 + 1px 边框 + 主文字色
- **危险按钮**：红色边框 + 红色文字，hover 时填充
- **图标按钮**：方形或圆形，仅图标无文字，配 tooltip
- 所有按钮：hover 时颜色加深 / 透明度变化，**不要放大、不要发光**

#### 11.6.5 顶部导航

- 高度：56px-64px
- 左：站点 Logo（纯文字或极简符号，不要复杂图形）
- 中：搜索框（占据中间宽度，圆角 `rounded-md`，背景 `bg-neutral-50`）
- 右：主题切换 · 用户头像（或"登录"按钮）
- 底部 1px 分隔线，不用阴影

### 11.7 推荐增补的库

继续使用模板内置的 `shadcn/ui` + `@tabler/icons-react` + `Tailwind CSS 4`，在此基础上增补：

| 库 | 用途 | 备注 |
|---|---|---|
| `framer-motion` | 卡片 hover、详情页过渡、模态进出 | 极简风的动效要"几乎察觉不到"，不要弹跳 |
| `shiki` 或 `prism-react-renderer` | 提示词文本块的语法高亮（轻量、可选）| 让提示词文本有"代码块"质感 |
| `react-masonry-css` | 瀑布流布局 | 也可纯 CSS columns 实现，看复杂度 |
| `cmdk` | 全站命令面板（Cmd+K 搜索，可选 P1）| Vercel / Linear 的标志特性 |
| Cloudflare Images 或 `unpic` | 响应式图片、自动 WebP | 与 R2 配合 |

**不推荐**：MUI、Ant Design、Chakra UI 等重型组件库——它们的默认风格与极简风冲突，且包体大。

### 11.8 移动端注意事项

- 卡片改为 2 列瀑布流（最小屏幕 1 列）
- 顶部导航简化：Logo + 搜索图标（点击展开）+ 头像
- 模型筛选改为横向滚动 Tabs
- 详情页：复制按钮做成大尺寸 sticky 底部按钮，方便单手操作
- 字号：移动端正文可上调到 15px（小屏阅读舒适度）

### 11.9 可访问性

- 文字与背景对比度满足 WCAG AA（正文 4.5:1，大字 3:1）
- 所有交互元素 focus 态可见（不能用 `outline: none` 然后不补任何替代样式）
- 图标按钮必须有 `aria-label`
- 表单错误信息不仅靠红色，还要有文字说明

### 11.10 视觉验收清单

UI 实现完成后逐项检查：

- [ ] 首屏没有任何渐变背景、发光元素、霓虹色
- [ ] 卡片只有边框、没有阴影（除模态外）
- [ ] 字重最多用到 600，没有超粗字体
- [ ] 所有圆角统一在 6px / 8px / 12px / full 这几个值
- [ ] 主按钮就是纯黑/纯白，没有彩色主按钮
- [ ] 主题切换后所有页面在两种模式下都看起来合理
- [ ] 提示词文本块的"复制"动作直观且反馈明确
- [ ] 整体感觉接近 Linear / Vercel / Raycast，而不是某个"AI 工具站"

---

## 附录 A：Cron Trigger 任务清单

所有 Cron 在 `wrangler.jsonc` 的 `triggers.crons` 中声明，处理函数集中在 `src/server.ts` 的 `scheduled` handler 中分发。

| ID | 频率 | Cron 表达式 | 任务 | 说明 |
|---|---|---|---|---|
| A1 | 每 10 分钟 | `*/10 * * * *` | KV 计数器合并到 D1 | 把点赞、复制、浏览的增量值合并到 `prompts.like_count` / `copy_count` / `view_count`；合并后清空对应 KV 键 |
| A2 | 每天凌晨 3:00 | `0 3 * * *` | 重算标签使用次数 | `UPDATE tags SET usage_count = (SELECT COUNT(*) FROM prompt_tags WHERE tag_id = tags.id)`，避免每次写提示词都更新 |
| A3 | 每天凌晨 3:30 | `30 3 * * *` | 失效旧的 sitemap 缓存 | 触发一次 sitemap 重新生成（写入 KV 缓存或调 Cache API purge） |
| A4 | 每小时 | `0 * * * *` | 清理过期的限速 / 防刷记录 | 清理 KV 中过期的限速 token、复制防刷标记 |
| A5 | 每天凌晨 4:00 | `0 4 * * *` | 数据备份（可选）| D1 导出快照到 R2，保留最近 30 天 |
| A6 | 每周一上午 9:00 | `0 9 * * 1` | Newsletter 候选数据生成（P1 启用） | 统计上周点赞 / 复制 Top N，写入 KV 供编辑选用 |

**实现要点**：

- 单次 Cron 执行有时间上限（取决于 Workers 套餐），重活拆批次或写入 Queue 异步处理
- 每个 Cron 任务里包一层 try-catch + 日志，单个任务失败不影响其他任务
- A1 是核心任务，**必须**实现，否则统计数据会丢失或滞后
- A5 在数据敏感度高时再启用，初期 Cloudflare D1 自带快照

---

## 附录 B：环境变量与 Secrets 清单

部署前需在 Cloudflare 控制台或 `wrangler secret put` 配齐。

### B.1 Secrets（敏感信息，必须用 `wrangler secret` 设置）

| 变量名 | 用途 | 来源 |
|---|---|---|
| `BETTER_AUTH_SECRET` | better-auth 签名密钥 | 自己生成（`openssl rand -base64 32`） |
| `GOOGLE_CLIENT_ID` | Google OAuth | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | Google Cloud Console |
| `RESEND_API_KEY` | Resend 邮件 API | resend.com |
| `ADMIN_EMAIL` | 系统通知邮件接收人 | 管理员邮箱 |
| `DISCORD_WEBHOOK_URL` | （可选）关键事件通知 | Discord 频道 webhook |
| `FEISHU_WEBHOOK_URL` | （可选）关键事件通知 | 飞书机器人 webhook |

### B.2 普通环境变量（`wrangler.jsonc` 的 `vars`）

| 变量名 | 用途 | 示例 |
|---|---|---|
| `VITE_SITE_URL` | 站点 URL（用于 OG / sitemap / 邮件链接）| `https://example.com` |
| `VITE_SITE_NAME` | 站点名称 | `精选提示词` |
| `VITE_PAYMENT_PROVIDER` | 支付供应商（P0 留空）| `''` |
| `VITE_DEFAULT_THEME` | 默认主题 | `'light'` |
| `ENV` | 环境标识 | `production` / `preview` / `development` |

### B.3 验证清单

部署前在 CI 或本地脚本中校验：

- [ ] 所有必填 secret 已设置（缺一即失败启动）
- [ ] `BETTER_AUTH_SECRET` 长度 ≥ 32 字符
- [ ] Resend 域名已验证（否则邮件发不出去）
- [ ] Google OAuth 回调 URL 已加白名单（包括 preview 环境）

---

## 附录 C：API / serverFn 路由清单

前后端契约。所有 serverFn 集中在 `src/api/`，命名按"资源 + 动作"。

### C.1 公开接口（无需登录）

| 接口 | 方法 | 描述 | 限速 |
|---|---|---|---|
| `getPromptsList(cursor?, model?, tag?, sort?, limit)` | serverFn | 获取提示词列表（首页、筛选页通用）| 60/min/IP |
| `getPromptDetail(idOrSlug)` | serverFn | 获取提示词详情 | 60/min/IP |
| `getRelatedPrompts(id, limit=8)` | serverFn | 获取相关推荐 | 60/min/IP |
| `searchPrompts(q, limit)` | serverFn | 关键词搜索 | 30/min/IP |
| `getModels()` | serverFn | 获取启用的模型列表（带缓存）| 100/min/IP |
| `getHotTags(limit=20)` | serverFn | 获取热门标签 | 100/min/IP |
| `getTagDetail(slug)` | serverFn | 标签详情（含该标签下的提示词）| 60/min/IP |
| `incrementCopyCount(id)` | serverFn | 复制计数 +1（写 KV）| 20/min/IP，5min 内同 IP 同 id 去重 |
| `GET /sitemap.xml` | 路由 | sitemap | 边缘缓存 6h |
| `GET /robots.txt` | 静态 | robots | - |
| `GET /og/prompt/:id.png` | 路由 | 动态 OG 图 | 边缘缓存 7d |

### C.2 用户接口（需登录）

| 接口 | 方法 | 描述 | 限速 |
|---|---|---|---|
| `toggleLike(promptId)` | serverFn | 切换点赞状态 | 30/min/user |
| `getMyCollections()` | serverFn | 获取我的收藏夹列表 | 60/min/user |
| `createCollection(name)` | serverFn | 新建收藏夹 | 10/min/user |
| `renameCollection(id, name)` | serverFn | 重命名 | 10/min/user |
| `deleteCollection(id)` | serverFn | 删除（默认夹不可删）| 10/min/user |
| `addToCollection(collectionId, promptId)` | serverFn | 添加到收藏夹 | 30/min/user |
| `removeFromCollection(collectionId, promptId)` | serverFn | 移除 | 30/min/user |
| `getCollectionDetail(id)` | serverFn | 收藏夹详情（含提示词列表）| 60/min/user |
| better-auth 路由 | - | 登录/注册/重置密码等 | 模板已配 |

### C.3 管理员接口（需 admin role）

| 接口 | 描述 |
|---|---|
| `admin.listPrompts(filters)` | 列出所有提示词（含草稿）|
| `admin.createPrompt(data)` | 新建提示词 |
| `admin.updatePrompt(id, data)` | 编辑 |
| `admin.publishPrompt(id)` | 发布（status → published）|
| `admin.archivePrompt(id)` | 下架 |
| `admin.deletePrompt(id)` | 删除（建议软删除）|
| `admin.batchUpdateStatus(ids[], status)` | 批量改状态 |
| `admin.getUploadUrl(filename, contentType)` | 生成 R2 预签名上传 URL |
| `admin.listModels()` / `createModel` / `updateModel` / `toggleModel` | 模型管理 |
| `admin.listTags()` / `createTag` / `updateTag` / `mergeTags(fromId, toId)` / `deleteTag` | 标签管理 |
| `admin.listUsers(filters)` | 用户管理（模板已有）|

### C.4 统一约定

- **入参校验**：所有 serverFn 入参用 zod schema，失败返回 400
- **错误返回结构**：`{ error: { code: string, message: string, details?: any } }`
- **常见错误码**：`unauthorized` / `forbidden` / `not_found` / `rate_limited` / `validation_error` / `internal_error`
- **响应时间**：边缘 SLO P95 < 500ms，超过需要排查（D1 慢查询、未走缓存等）

---

## 附录 D：Cloudflare 资源绑定清单

在 `wrangler.jsonc` 中配置，部署前确认绑定齐全。

| 类型 | 绑定名 | 用途 | 备注 |
|---|---|---|---|
| **D1 Database** | `DB` | 主数据库 | 生产/预览/开发各一个实例 |
| **R2 Bucket** | `BUCKET` | 效果图、模型 icon、用户上传 | 公开读 + 私有写，配 Custom Domain |
| **KV Namespace** | `COUNTERS` | 计数器中转（点赞/复制/浏览）| |
| **KV Namespace** | `CACHE` | 业务缓存（热门标签、sitemap 等）| |
| **KV Namespace** | `RATE_LIMIT` | 限速 / 防刷标记 | |
| **Rate Limit Binding** | `RL_API` | API 限速 | 按 IP / user |
| **Rate Limit Binding** | `RL_AUTH` | 认证接口限速 | 防暴破 |
| **Cron Triggers** | - | 见附录 A | |
| **Cloudflare Images**（可选）| - | 图片自动 WebP / 响应式 | 单独服务，按用量计费 |
| **Workers Analytics Engine**（可选）| `ANALYTICS` | 自定义埋点存储 | 用于附录 E |

**部署前检查**：

- [ ] 每个环境（production / preview / development）的资源 ID 不能混用
- [ ] R2 公开访问域名配好（CDN + 自定义域名，否则图片走默认 r2.dev URL 速度差且不专业）
- [ ] D1 已跑过最新 migration

---

## 附录 E：埋点事件清单

用于可观测性、用户行为分析、运营决策。所有埋点通过统一 `track(event, props)` 工具发送，写入 Workers Analytics Engine 或 Cloudflare Logs。

### E.1 核心事件

| 事件名 | 触发时机 | 关键属性 |
|---|---|---|
| `page_view` | 任何页面 SSR / 路由跳转 | `path`, `referrer`, `user_id?` |
| `prompt_view` | 详情页加载成功 | `prompt_id`, `model`, `source` |
| `prompt_copy` | 用户点击复制 | `prompt_id`, `is_logged_in` |
| `prompt_like` | 用户点赞 | `prompt_id`, `action` (like/unlike) |
| `prompt_collect` | 用户加入收藏夹 | `prompt_id`, `collection_id` |
| `search` | 用户提交搜索 | `query`, `result_count` |
| `filter_model` | 切换模型筛选 | `model` |
| `filter_tag` | 点击标签 | `tag` |
| `signup_start` | 进入注册页 | `from` |
| `signup_success` | 注册成功 | `method` (email/google) |
| `login_success` | 登录成功 | `method` |
| `rate_limited` | 触发限速 | `endpoint`, `ip_hash` |
| `error` | 5xx 错误或前端崩溃 | `code`, `message`, `path` |

### E.2 核心指标（基于埋点）

P0 上线后重点看：

- **DAU / WAU / MAU**
- **复制率**：`prompt_copy 数 / prompt_view 数`（产品价值的最直接指标）
- **登录转化**：浏览用户中注册成功的比例
- **收藏率**：`prompt_collect / prompt_view`
- **搜索成功率**：搜索后是否点击结果
- **热门内容 TOP 20**：按复制数、点赞数排序

### E.3 注意事项

- **不存可识别 PII**：IP 做 hash，不存原始 IP；不在埋点里存邮箱、姓名
- **采样**：高频事件（如 page_view）可按需采样（如 10%）避免日志爆炸
- **优雅降级**：埋点失败不影响主流程，全部 try-catch + 异步

---

## 附录 F：术语表

团队对齐口径用。

| 术语 | 定义 |
|---|---|
| **Prompt（提示词）** | 平台核心内容单元，包含文本、效果图、模型标签等 |
| **Model（模型）** | 提示词适用的 AI 模型，从预设列表中选择 |
| **Tag（标签）** | 提示词的主题分类（如「人像」「写作」），多对多 |
| **Collection（收藏夹）** | 用户的私人分组容器 |
| **Slug** | URL 友好的字符串标识（中文转拼音）|
| **serverFn** | TanStack Start 的服务端函数，前后端类型安全 |
| **D1** | Cloudflare 的边缘 SQLite 数据库 |
| **R2** | Cloudflare 的对象存储（兼容 S3 API）|
| **KV** | Cloudflare Key-Value 存储，最终一致 |
| **Cron Trigger** | Cloudflare Workers 的定时任务 |
| **Workers** | Cloudflare 边缘运行环境（非 Node.js）|
| **better-auth** | 本项目使用的认证库 |
| **P0 / P1 / P2** | 需求优先级，分别对应 MVP / 次版本 / 远期 |
| **DAU / WAU / MAU** | 日 / 周 / 月活跃用户 |
| **LCP** | Largest Contentful Paint，关键性能指标 |
| **WCAG AA** | Web 内容可访问性指南 AA 级标准 |
| **PII** | 个人身份信息（Personally Identifiable Information）|

---

## 12. 文档变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|---|---|---|---|
| v0.1 | 2026-05-09 | 初版，覆盖 MVP 范围 | - |
| v0.2 | 2026-05-11 | 新增第 2 章「技术栈与架构」，后续章节顺延 | - |
| v0.3 | 2026-05-11 | 新增第 11 章「UI / 视觉设计指引」，确定极简专业风方向 | - |
| v0.4 | 2026-05-11 | §4.2 每个功能模块补充「技术实现」段落；修正 §4.2 子节编号 | - |
| v0.5 | 2026-05-11 | 新增 6 个附录（A–F）：Cron 任务、环境变量、API 清单、资源绑定、埋点、术语表；整理章节编号使其连续（UI 章从 §12 → §11，变更记录从 §13 → §12）| - |
