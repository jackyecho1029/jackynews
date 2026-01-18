---
name: xhs-viral-analysis
description: "小红书爆款内容深度分析工作流。使用 MediaCrawler 抓取数据，Gemini 3 Flash 进行 AI 深度分析，生成标题模式、内容框架、评论洞察、可操作模板，并发布到博客。"
license: MIT
---

# 🔥 小红书爆款分析 Skill

## 概述

这个 Skill 提供了一套完整的小红书爆款内容分析工作流：

1. **数据采集**: 使用 MediaCrawler 按关键词抓取小红书帖子和评论
2. **深度分析**: 使用 Gemini 3 Flash API 进行多维度爆款拆解
3. **报告生成**: 输出 Markdown + HTML 双格式报告
4. **博客发布**: 自动发布到 potatoecho.com/xhs-viral

## 前置条件

### 环境要求
- **Python 3.11+**: 运行 MediaCrawler 和分析脚本
- **Node.js 18+**: 运行博客 (Next.js)
- **Git**: 版本控制和发布

### API 密钥
需要在 `potatoblog/.env.local` 中配置：
```bash
GEMINI_API_KEY=your_gemini_api_key_here
# 或
gemini_api_key=your_gemini_api_key_here
```

### 目录结构
```
D:\Antigravity\Jackypotato\
├── tools\MediaCrawler\           # 数据抓取工具
│   ├── data\xhs\json\            # 抓取的原始数据
│   ├── data\xhs\analysis\        # 分析报告输出
│   ├── deep_viral_analysis.py    # 深度分析脚本
│   └── run_xhs_search.bat        # 抓取快捷脚本
└── potatoblog\                   # 博客项目
    ├── posts\xhs-viral\          # 爆款分析文章
    ├── lib\xhs-viral.ts          # 数据处理库
    └── app\xhs-viral\            # 前端页面
```

---

## 工作流程

### 第一步: 抓取小红书数据

#### 1.1 启动 MediaCrawler

```bash
cd D:\Antigravity\Jackypotato\tools\MediaCrawler

# 激活虚拟环境 (如果有)
# 运行抓取脚本
py -3 main.py --platform xhs --lt qrcode --type search
```

#### 1.2 输入搜索关键词

当提示输入关键词时，输入你要分析的话题，例如：
```
一人公司
AI工具
超级个体
```

#### 1.3 扫码登录

脚本会生成一个二维码，使用小红书 App 扫码登录。

#### 1.4 等待抓取完成

抓取完成后，数据会保存到：
- `data/xhs/json/search_contents_YYYY-MM-DD.json` (帖子数据)
- `data/xhs/json/search_comments_YYYY-MM-DD.json` (评论数据)

---

### 第二步: 运行深度分析

```bash
cd D:\Antigravity\Jackypotato\tools\MediaCrawler

# 分析指定关键词的 Top 10 帖子
py -3 deep_viral_analysis.py -k "一人公司" -n 10
```

#### 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `-k, --keyword` | 要分析的关键词 | 必填 |
| `-n, --top` | 分析 Top N 帖子 | 10 |
| `-i, --input` | 输入JSON文件路径 | 自动选择最新 |
| `-c, --comments` | 评论JSON文件路径 | 自动选择最新 |
| `-o, --output` | 输出目录 | `data/xhs/analysis/` |

#### 输出文件

分析完成后生成：
- `data/xhs/analysis/[关键词]_deep_analysis_YYYY-MM-DD.md`
- `data/xhs/analysis/[关键词]_deep_analysis_YYYY-MM-DD.html`

---

### 第三步: 预览分析报告

双击打开 HTML 报告，在浏览器中查看：
```
D:\Antigravity\Jackypotato\tools\MediaCrawler\data\xhs\analysis\一人公司_deep_analysis_2026-01-19.html
```

报告包含：
- 📊 **数据看板**: 分析样本数、最高点赞/收藏
- 📈 **整体分析**: 标题模式、内容框架、评论洞察
- 👑 **冠军拆解**: Top 1 帖子的深度拆解
- 📋 **原始数据**: Top 10 帖子数据表格

---

### 第四步: 发布到博客

#### 4.1 创建博客文章

将分析内容整理成博客文章：

```bash
# 复制并重命名 (使用英文文件名)
copy "data\xhs\analysis\一人公司_deep_analysis_2026-01-19.md" ^
     "D:\Antigravity\Jackypotato\potatoblog\posts\xhs-viral\2026-01-19-yiren-gongsi-deep-analysis.md"
```

#### 4.2 编辑文章 Frontmatter

确保文章顶部包含正确的元数据：

```yaml
---
title: "「一人公司」小红书爆款内容深度分析"
date: "2026-01-19"
keyword: "一人公司"
analyzed_posts: 10
tags: ["一人公司", "超级个体", "创业", "小红书"]
summary: "解密标题公式、内容框架、评论洞察，附送5个可直接复用的标题模板。"
---
```

#### 4.3 验证本地预览

```bash
cd D:\Antigravity\Jackypotato\potatoblog
cmd /c "npm run dev"
```

访问 `http://localhost:3000/xhs-viral` 预览。

#### 4.4 推送到 GitHub

```bash
cd D:\Antigravity\Jackypotato\potatoblog

git add posts/xhs-viral/
git commit -m "feat: add XHS viral analysis - 一人公司"
git push origin main
```

Vercel 会自动部署，约 1-2 分钟后可在 `https://potatoecho.com/xhs-viral` 查看。

---

## 分析报告结构

深度分析脚本会生成以下内容：

### 整体分析 (10篇汇总)

1. **标题分析**
   - 标题模式图谱 (表格)
   - 钩子技巧分析
   - 5个可复用标题模板

2. **内容框架分析**
   - 爆款内容公式
   - 开场设计 (黄金3秒)
   - 价值传递方式
   - 互动促进技巧

3. **评论区洞察**
   - 用户画像提取
   - 高互动评论特征
   - 运营机会发现

4. **Potato 独家见解**
   - 被忽视的成功因素
   - 战略建议
   - 风险与陷阱

5. **可操作模板库**
   - 标题模板
   - 开场模板
   - 内容结构模板

6. **行动计划**
   - 本周任务清单
   - 30天内容计划

### 冠军拆解 (Top 1 深度)

- 标题工程学
- 心理触发机制
- 内容结构分析
- 评论区洞察

---

## 快捷命令

### 一键分析 (批处理脚本)

创建 `run_analysis.bat`:

```batch
@echo off
cd /d D:\Antigravity\Jackypotato\tools\MediaCrawler
set /p keyword="请输入要分析的关键词: "
py -3 deep_viral_analysis.py -k "%keyword%" -n 10
echo.
echo 分析完成！请查看 data\xhs\analysis 目录
pause
```

### 完整工作流脚本

```bash
# 1. 抓取数据
cd D:\Antigravity\Jackypotato\tools\MediaCrawler
py -3 main.py --platform xhs --lt qrcode --type search

# 2. 分析数据
py -3 deep_viral_analysis.py -k "你的关键词" -n 10

# 3. 复制到博客
copy "data\xhs\analysis\*_deep_analysis_*.md" ^
     "D:\Antigravity\Jackypotato\potatoblog\posts\xhs-viral\"

# 4. 发布
cd D:\Antigravity\Jackypotato\potatoblog
git add . && git commit -m "feat: add XHS analysis" && git push
```

---

## 常见问题

### Q: Gemini API 调用失败？
确保 API Key 配置正确：
```bash
# 检查 .env.local
cat D:\Antigravity\Jackypotato\potatoblog\.env.local | findstr -i gemini
```

### Q: 中文文件名导致博客报错？
使用拼音或英文作为文件名，中文放在 frontmatter 的 `title` 和 `keyword` 字段中。

### Q: PowerShell 执行策略错误？
使用 `cmd /c` 前缀：
```bash
cmd /c "py -3 deep_viral_analysis.py -k 一人公司"
```

### Q: 抓取速度慢或被限制？
- 降低抓取频率
- 使用不同账号轮换
- 添加随机延迟

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `tools/MediaCrawler/deep_viral_analysis.py` | 深度分析脚本 |
| `tools/MediaCrawler/analyze_viral_posts.py` | 基础分析脚本 |
| `potatoblog/lib/xhs-viral.ts` | 博客数据处理 |
| `potatoblog/app/xhs-viral/page.tsx` | 列表页面 |
| `potatoblog/app/xhs-viral/[slug]/page.tsx` | 详情页面 |
| `potatoblog/posts/xhs-viral/` | 分析文章目录 |

---

## 更新日志

- **v2.0** (2026-01-19): 升级到 Gemini 3 Flash，新增评论分析和 HTML 报告
- **v1.0** (2026-01-19): 初始版本，基础分析功能

---

*Powered by Potato Analytics 🥔*
