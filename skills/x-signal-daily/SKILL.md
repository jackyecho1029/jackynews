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

### Step 1: Check Existing Posts

```bash
cd D:\Antigravity\Jackypotato\potatoblog
dir posts\x-signals
```

Verify the latest file date. Today's file should be named `YYYY-MM-DD-daily-signals.md`.

### Step 2: Gather Content

**Primary Sources** (X accounts to monitor):
- @naval - Philosophy, AI, wealth
- @levelsio - Indie hacking, solo entrepreneurship
- @SahilBloom - Productivity, mindset
- @Codie_Sanchez - Business acquisition, wealth
- @paulg - Startups, technology
- @elonmusk - Tech innovation
- @Nicolascole77 - Writing, marketing

**Content Categories**:
1. 🤖 AI & Future Tech
2. 💰 Wealth & Solo-preneurship
3. 📢 Marketing & Branding
4. 🧠 Wisdom & Productivity

### Step 3: Create the Post Manually

Since there is **no automated scraper** for X content, the post must be created manually:

1. Research trending topics from the monitored accounts
2. Use web search to gather recent insights
3. Create the markdown file following the template above
4. Include source links in format: `[Source](https://x.com/username/status/xxx)`

**Example command to create file**:
```bash
# Create new file (replace date)
code posts/x-signals/2026-01-17-daily-signals.md
```

### Step 4: Publish to Blog

```bash
cd D:\Antigravity\Jackypotato\potatoblog

# Stage the new file
git add posts/x-signals/YYYY-MM-DD-daily-signals.md

# Commit
git commit -m "feat: add X Signal daily post for YYYY-MM-DD"

# Push to trigger Vercel deployment
git push origin main
```

### Step 5: Verify Deployment

Visit: `https://potatoecho.com/x-signals` to confirm the new post appears.

## Optional: Image Enhancement (Deprecated)

> ⚠️ **Note**: Image generation has been disabled as per user preference.

Previously, `scripts/enhance-x-signals.ts` was used to:
- Generate Doraemon-style illustrations for each viewpoint
- Simplify technical jargon for beginners

To run (if needed):
```bash
cmd /c "npx tsx scripts/enhance-x-signals.ts"
```

## Troubleshooting

### Git Push Rejected
```bash
git stash
git pull --rebase origin main
git stash pop
git push origin main
```

### PowerShell Execution Policy Error
Use `cmd /c` prefix:
```bash
cmd /c "npx tsx scripts/enhance-x-signals.ts"
```

## Related Files

- `lib/x-signals.ts` - Post data reader for the blog
- `app/x-signals/page.tsx` - X Signal listing page
- `app/x-signals/[slug]/page.tsx` - Individual post page
- `scripts/enhance-x-signals.ts` - Image enhancement script (optional)
