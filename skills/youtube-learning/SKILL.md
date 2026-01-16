---
name: youtube-learning
description: "Fetches YouTube videos, extracts transcripts, generates AI summaries, and publishes to the Learning section of potatoblog. Use this when the user wants to add a YouTube video to the learning library."
license: Proprietary
---

# YouTube Learning Upload Workflow

## Overview

This skill processes YouTube videos and creates rich learning posts for **potatoecho.com/learning**. Each video is analyzed using Gemini AI to extract key insights, action items, and memorable quotes.

## Prerequisites

- **Working Directory**: `D:\Antigravity\Jackypotato\potatoblog`
- **Environment**: Node.js with `tsx` installed
- **API Keys** (in `.env.local`):
  - `YOUTUBE_API_KEY` - For fetching video metadata
  - `GEMINI_API_KEY` - For AI summarization

## Output Location

- **Posts Directory**: `posts/learning/`
- **File Naming**: `YYYY-MM-DD-[sanitized-title].md`
- **Live URL**: `https://potatoecho.com/learning`

## Workflow Steps

### Step 1: Run the Fetch Script

```bash
cd D:\Antigravity\Jackypotato\potatoblog

# For a specific YouTube URL
cmd /c "npx tsx scripts/fetch-learning.ts https://www.youtube.com/watch?v=VIDEO_ID"
```

The script will automatically:
1. Fetch video metadata (title, channel, thumbnail)
2. Extract the transcript
3. Generate an AI summary using Gemini
4. Create a markdown post

### Step 2: Verify the Output

Check that the file was created:
```bash
dir posts\learning
```

### Step 3: Publish to Blog

```bash
# Stage the new file
git add posts/learning/YYYY-MM-DD-*.md

# Commit
git commit -m "feat: add learning post - [Video Title]"

# Push to trigger Vercel deployment
git push origin main
```

### Step 4: Verify Deployment

Visit: `https://potatoecho.com/learning` to confirm the new post appears.

## Content Structure

Each learning post is generated with this structure:

```markdown
---
title: "[Hook Title in Chinese]"
original_title: "[Original English Title]"
author: "[Channel Name]"
category: "[Category]"
date: "YYYY-MM-DD"
tags: ["[Category]", "[Author]"]
source_url: "https://www.youtube.com/watch?v=VIDEO_ID"
thumbnail: "https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
---

## 🎯 核心观点

### 观点一：[Title]
[Explanation]
**因為：**
- [Point 1]
- [Point 2]

---

## 📚 关键词
**1. [Term] ([English])**
> **含义：** [Definition]
**💼 案例：** [Real-world example]

---

## 💎 金句精选
> "[Chinese translation]"
> （原文：[English original]）

---

## 💡 行动建议

**第一步：[Action Name]**
[Steve Jobs-style motivational explanation]

---

### One More Thing...
[Surprising final insight]
```

## Categories

The script automatically assigns one of these categories:
- 思维成长
- 商业创业
- 健康生活
- 职场效率
- 人际关系
- 科技趋势
- 投资理财
- 创意艺术

## Batch Processing (Auto Mode)

To check all monitored channels for new videos:

```bash
cmd /c "npx tsx scripts/fetch-learning.ts"
```

This will:
1. Scan all channels defined in `YOUTUBE_CHANNELS` env variable
2. Skip videos already processed (by ID match)
3. Skip shorts and videos < 15 minutes
4. Process only new long-form content

## Monitored Channels

Configure in `.env.local`:
```
YOUTUBE_CHANNELS=@timferriss,@hubaborhauer,@naval,...
```

## Troubleshooting

### No Transcript Available
Some videos don't have transcripts. The script will fall back to using the video description.

### API Rate Limits
If you hit YouTube API limits, wait a few minutes before retrying.

### PowerShell Execution Policy Error
Use `cmd /c` prefix:
```bash
cmd /c "npx tsx scripts/fetch-learning.ts URL"
```

### Git Push Rejected
```bash
git stash
git pull --rebase origin main
git stash pop
git push origin main
```

## Related Files

- `scripts/fetch-learning.ts` - Main processing script
- `lib/posts.ts` - Post data reader for the blog
- `app/learning/page.tsx` - Learning listing page
- `app/learning/[slug]/page.tsx` - Individual post page

## GitHub Action (Optional)

A daily automation workflow can be configured at:
`.github/workflows/daily-learning-update.yml`

This runs automatically to check for new videos from monitored channels.
