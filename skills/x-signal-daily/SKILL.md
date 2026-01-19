---
name: x-signal-daily
description: "Creates and publishes the daily X Signal post to potatoblog. Use this when the user wants to generate today's X Signal content from trending AI/tech/wealth discussions on X (Twitter)."
license: Proprietary
---

# X Signal Daily Update Workflow

## Overview

This skill generates the daily "X Signal" post for **potatoecho.com/x-signals**. The X Signal is a curated digest of AI, tech, wealth, and productivity insights from influential voices on X (Twitter).

## Prerequisites

- **Working Directory**: `D:\Antigravity\Jackypotato\potatoblog`
- **Environment**: Node.js with `tsx` installed
- **Gemini API Key**: Set in `.env.local` as `GEMINI_API_KEY`

## Output Location

- **Posts Directory**: `posts/x-signals/`
- **File Naming**: `YYYY-MM-DD-daily-signals.md`
- **Live URL**: `https://potatoecho.com/x-signals/[YYYY-MM-DD-daily-signals]`

## Content Structure

Each X Signal post follows this format:

```markdown
---
title: "Daily X Signals: YYYY-MM-DD"
date: "YYYY-MM-DD"
category: "X Signal"
tags: ["X", "AI", "Wealth", "Productivity", "Entrepreneurship"]
title_best: "[Chinese headline summary]"
anchor_thought: "[Thought-provoking quote for the day]"
---

> 借全球智慧之光，筑个人认知之塔。

### 🤖 AI & Future Tech
[Bullet points with sources]

**Potato's Take**
重要观点
[Analysis paragraph]

行动建议
[Numbered action items]

---

### 💰 Wealth & Solo-preneurship
[Same structure as above]

---

### 📢 Marketing & Branding
[Same structure as above]

---

### 🧠 Wisdom & Productivity
[Same structure as above]

---

**💡 今日金句：**
[Chinese translation]
[English original] —— [Author]
```

## Workflow Steps

### Step 1: Automated Generation

Since the system is now fully automated (V1), you do not need to manually check posts or draft content.

Run the one-click generation script:

```bash
cd D:\Antigravity\Jackypotato\potatoblog
npm run generate-x-signal
```

**What this script does:**
1.  **Fetches** latest tweets from 30+ sources (via local RSSHub + your Auth Token).
2.  **Deduplicates** content against the last 7 days of posts.
3.  **Generates** a full Markdown post using Gemini AI, including:
    *   Dynamic Title & Anchor Thought
    *   Category Classification
    *   Chinese Summary & "Potato's Take"
    *   **Source Links** for every viewpoint
4.  **Saves** the file to `posts/x-signals/[YYYY-MM-DD]-daily-signals.md`.

### Step 2: Publish to Blog

Once the script finishes (it will say `✅ Created/Updated draft`), simply push to GitHub:

```bash
git add .
git commit -m "feat: daily x signal update"
git push
```

Vercel will automatically deploy the changes.

## Optional: Configuration

-   **Add Sources**: Edit `config/x-sources.json` to add new Twitter handles.
-   **Update Token**: If fetching fails (503 error), update `TWITTER_AUTH_TOKEN` in `D:\Antigravity\Jackypotato\tools\RSSHub\.env` with a fresh browser cookie.

## Related Files

- `lib/x-signals.ts` - Post data reader for the blog
- `app/x-signals/page.tsx` - X Signal listing page
- `app/x-signals/[slug]/page.tsx` - Individual post page
- `scripts/enhance-x-signals.ts` - Content simplification script (Image generation disabled)
