# 🔥 Ceramic Voices Reddit Engagement Skill

> 自动化 Reddit 社群互动工具，帮助陶瓷品牌 **Ceramic Voices** 在 r/pottery、r/ceramics、r/tea 等社区建立影响力。

---

## ✨ 功效

| 功能 | 描述 |
|------|------|
| 🕷️ **数据爬取** | 从 Reddit Intelligence Dashboard 抓取热门帖子 |
| 🎯 **智能筛选** | 用品牌逻辑过滤高价值互动目标 |
| 🤖 **AI 评论生成** | 使用 Gemini 生成符合品牌人设的评论 |
| 🎭 **多风格输出** | 每帖生成 3 种风格评论（Sassy / Deep / Punchy） |

---

## 🚀 一键运行

```bash
cd D:\Antigravity\Jackypotato\skills\ceramic-voices-reddit
npx tsx daily_run.ts
```

或者告诉 Antigravity：
> "运行 Ceramic Voices Reddit 每日工作流"

---

## 📋 完整流程

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 爬取数据                                           │
│  从 Reddit Intelligence Dashboard 获取热门帖子               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: 智能过滤                                           │
│  根据 Ceramic Voices 品牌逻辑筛选目标帖子                    │
│  • POTTERY_COMMENT - 陶艺同行互动                           │
│  • VIBE_MATCH - 茶文化/极简主义共鸣                         │
│  • DESIGN_CRITIQUE - 室内设计"米色疲劳"诊断                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: AI 推断图片                                        │
│  使用 Gemini 根据标题推断帖子图片内容                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: 生成评论                                           │
│  使用 Tudou 人设生成 3 种风格评论                            │
│  🎭 Sassy/Funny  🪷 Deep/Aesthetic  ⚡ Short/Punchy         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 5: 输出结果                                           │
│  output/full_comments_draft.md - 可直接复制使用              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎭 Tudou 人设

> **Tudou** 是 Ceramic Voices 的创始人，一位来自景德镇的陶瓷策展人。

**人设特点：**
- 老练、略带古怪、知识渊博
- 讨厌"无聊的米色"和"没有灵魂的量产品"
- 热爱"极致的寂静"或"极致的混乱"
- 说话风格：大胆、有态度、带点毒舌幽默

**评论示例：**

| 风格 | 评论 |
|------|------|
| 🎭 Sassy | "Honey, those early bowls look like they were thrown by a caffeinated squirrel." |
| 🪷 Deep | "Clay remembers. Every touch, every intention. What story are you etching into its soul?" |
| ⚡ Punchy | "Kill it with fire. Then send me the ashes." |

---

## 📁 文件结构

```
ceramic-voices-reddit/
├── README.md                   # 本文档
├── SKILL.md                    # Antigravity Skill 配置
├── package.json                # Node.js 依赖
│
├── 📜 Scripts
├── daily_run.ts                # 每日一键运行
├── process_reddit_data.ts      # 数据过滤器
├── run_full_pipeline.ts        # 评论生成器
├── retry_failed.ts             # 失败重试器
│
├── 📂 data/
│   ├── reddit_export.json          # 爬取的原始数据
│   └── ceramic_voices_targets.json # 过滤后的目标
│
└── 📂 output/
    ├── full_comments.json          # JSON 格式评论
    └── full_comments_draft.md      # 可直接使用的评论草稿
```

---

## ⚙️ 配置参数

可在 `run_full_pipeline.ts` 中调整：

```typescript
BATCH_SIZE = 5           // 每批处理帖子数
BATCH_DELAY_MS = 3000    // 批次间隔（毫秒）
POST_DELAY_MS = 2000     // 帖子间隔（毫秒）
MAX_POSTS = 20           // 最大处理数量
MAX_RETRIES = 2          // 失败重试次数
```

---

## 📦 依赖

- Node.js 18+
- `@google/generative-ai` - Gemini API
- `dotenv` - 环境变量管理
- `tsx` - TypeScript 运行器

---

## 🔗 相关链接

- [Reddit Intelligence Dashboard](https://wordcrafter.ai/reddit-intelligence-dashboard)
- [Ceramic Voices 品牌](https://jdzcreation.com)

---

## 📄 License

Proprietary - For Ceramic Voices / JDZ Creation use only.
