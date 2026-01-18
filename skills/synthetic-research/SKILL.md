---
name: synthetic-research
description: "AI 驱动的市场调研工具。生成成百上千个「真实用户可能搜索」的长尾问题，用于 SEO、内容选题和产品痛点挖掘。"
license: MIT
---

# 🧠 Synthetic AI Research Skill

## 概述

这个工具复刻了 Britney Muller 的 "Synthetic AI Search Query Generator"。它不依赖昂贵的 SEO 工具，而是利用 **Gemini 3 Flash** 的推理能力，模仿真人用户在 Reddit 上的提问方式，并将其裂变为海量的长尾搜索词。

这对 "CeramicVoices" 和 "One Person Company" 非常有用，因为它能帮你找到**别人还没发现的用户真实痛点**。

## 工作原理

1. **种子生成 (Seed)**: 让 AI 扮演 Reddit 发烧友，对特定话题疯狂提问。
2. **裂变扩展 (Expand)**: 将每个问题裂变为 5 种不同意图的搜索词（信息型、交易型、导航型等）。
3. **数据导出 (Excel)**: 生成表格，直接用于规划内容。

## 快速使用

### 环境准备

工具位于：`D:\Antigravity\Jackypotato\tools\Research\synthetic_query_generator.py`

### 运行指令

在终端中运行：

```bash
cd D:\Antigravity\Jackypotato\tools\Research

# 基础用法
python synthetic_query_generator.py "Ceramic Vases"

# 自定义种子数量 (默认20，建议50以获得更多结果)
python synthetic_query_generator.py "One Person Company" --seeds 50
```

### 结果查看

运行完成后，结果会保存在同目录下的 `data/` 文件夹中，格式为 Excel (.xlsx)。

---

## 为 CeramicVoices 做调研的实战策略

你可以尝试运行以下指令，挖掘潜在买家的需求：

1. **痛点挖掘**:
   ```bash
   python synthetic_query_generator.py "buying handmade ceramics online problems"
   ```
   *目的*: 发现用户怕什么（怕碎？怕色差？），然后在你的网站首页解决这些担忧。

2. **礼物场景**:
   ```bash
   python synthetic_query_generator.py "unique ceramic gifts for girlfriend"
   ```
   *目的*: 生成大量长尾关键词，写一篇 "Top 10 Ceramic Gifts" 的博客文章来截流。

3. **风格探索**:
   ```bash
   python synthetic_query_generator.py "modern colorful pottery home decor"
   ```
   *目的*: 看看用户在搜什么具体的颜色或形状（e.g., "blob vase", "donut mug"）。

---

## 进阶：Reddit API 集成 (可选)

目前的版本是 "Gemini 模拟版"。如果你想要**真实抓取** Reddit 数据：

1. 去 [Reddit App Preferences](https://www.reddit.com/prefs/apps) 创建一个应用。
2. 获取 `client_id` 和 `client_secret`。
3. 把它们填入 `.env.local`。
4. 告诉我，我会更新脚本开启真实抓取模式。

---

*Powered by Potato Analytics 🥔*
