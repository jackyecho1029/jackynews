---
name: youtube-discovery
description: "Automates YouTube content discovery and analysis. Handles daily creator video tracking, Friday short-form high-viral gem hunting, and Saturday long-form deep analysis for small channels with high-performance videos."
license: Proprietary
---

# YouTube Discovery & Viral Analysis Workflow

## Overview

This skill standardizes the process of finding and analyzing high-value YouTube content across three distinct tracks:
1.  **Daily Creator Tracking**: Monitoring specific high-quality creators for new deep-dive content.
2.  **Friday Short-Form Gems**: Discovering small channels (<10k subs) with viral short-form videos (high view-to-sub ratio).
3.  **Saturday Long-Form Gems**: Identifying small channels (<20k subs) with high-performance long-form videos (>6 mins) for case study analysis.

## Prerequisites

- **Working Directory**: `D:\Antigravity\Jackypotato\potatoblog`
- **Environment**: Node.js with `tsx` installed.
- **API Keys**: `YOUTUBE_API_KEY` and `GEMINI_API_KEY` configured in `potatoblog/.env.local`.
- **Channel List**: Target channels for daily tracking defined in `YOUTUBE_CHANNELS` env variable.

## Workflow Tracks

### 1. Daily: Creator Video Updates
Tracks new long-form videos from the curated list of experts/creators. Summarizes them using the Pyramid Principle.

**Command:**
```powershell
# In D:\Antigravity\Jackypotato\potatoblog
npm run update-learning
```

**Outputs:**
- `posts/learning/[DATE]-[TITLE].md`: AI-summarized deep dives with Steve Jobs style action advice.

---

### 2. Friday: Short-Form Viral Gems
Identifies "Hidden Gems" (small channels with high view counts) to find viral patterns.

**Commands:**
```powershell
# 1. Discovery phase
npm run find-gems

# 2. Deep Analysis phase (Process top 5 findings)
npm run analyze-gems
```

**Outputs:**
- `reports/gems/[DATE]-hidden-gems.md`: List of top 20 viral small-channel videos.
- `posts/gems/[DATE]-[TITLE].md`: In-depth analysis of the top viral candidates.

---

### 3. Saturday: Long-Form Viral Gems
Finds high-retention long-form videos from small channels for deep strategy breakdowns.

**Commands:**
```powershell
# 1. Discovery phase
npm run find-long-gems

# 2. Deep Analysis phase
npm run analyze-long-gems
```

**Outputs:**
- `reports/gems/[DATE]-long-gems.md`: Report of high-performance long-form videos.
- `posts/gems/[DATE]-[TITLE].md`: Detailed breakdown of content strategy and retention hooks.

## Verification

1.  **Check Blogs**: New files should appear in `posts/learning/` (daily) or `posts/gems/` (weekends).
2.  **Check Reports**: Review `reports/gems/` for the latest viral discovery tables.
3.  **Check Images**: Ensure any generated visuals for the blog posts are correctly linked in the previews.

## Common Operations

### Focus on a Specific Video
If you find a specific video you want to analyze immediately:
```powershell
npx tsx scripts/fetch-learning.ts "https://www.youtube.com/watch?v=VIDEO_ID"
```
