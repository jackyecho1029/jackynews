---
name: ceramic-voices-reddit
description: "Scrapes Reddit Intelligence Dashboard and generates AI-powered comments using the Tudou persona for pottery, ceramics, tea, and interior design communities. Run daily for fresh engagement opportunities."
license: Proprietary
---

# Ceramic Voices Reddit Engagement Skill

## 🚀 Daily Quick Start

Tell Antigravity:
> "Run the Ceramic Voices Reddit daily workflow"

Or run manually:
```bash
cd D:\Antigravity\Jackypotato\skills\ceramic-voices-reddit
npx tsx daily_run.ts
```

## 📋 Full Daily Workflow

| Step | Action | Command |
|------|--------|---------|
| 1 | Scrape Reddit Intelligence | Browser: go to dashboard URL |
| 2 | Filter posts | `npx tsx process_reddit_data.ts` |
| 3 | Generate comments | `npx tsx run_full_pipeline.ts` |
| 4 | Retry failures | `npx tsx retry_failed.ts` |
| 5 | Review & post | Open `output/full_comments_draft.md` |

## Overview

This skill automates Reddit engagement for the **Ceramic Voices** brand (JDZ Creation):
1. **Scrapes** data from Reddit Intelligence Dashboard
2. **Filters** posts using brand-specific logic
3. **Generates** AI-powered comments using the "Tudou" persona


## Workflow

### Step 1: Scrape Data (Browser)

Use Antigravity's browser to scrape the Reddit Intelligence Dashboard:

```
"Go to https://wordcrafter.ai/reddit-intelligence-dashboard?hash=e62845635b85970fcf8542bd6d199cf250436848042a8cbd63cd58a3f29d7083 and extract all the Reddit posts data (titles, scores, subreddits, URLs). Save as JSON."
```

### Step 2: Run Data Processor

```bash
cd D:\Antigravity\Jackypotato\skills\ceramic-voices-reddit
python process_reddit_data.py
```

**Input**: `reddit_export.json` (scraped data)
**Output**: `ceramic_voices_targets.json` (filtered, actionable posts)

### Step 3: Generate Comments

```bash
python generate_comments.py
```

Or use Antigravity prompt:
> "Read `ceramic_voices_targets.json`. For each post, write a Reddit comment using the Tudou persona based on the `strategy_guide` field."

## Filtering Logic

### Strategy 1: DESIGN_CRITIQUE (Interior Design)
- **Trigger**: Posts mentioning "boring", "empty", "beige", "help"
- **Action**: Diagnose "Beige Fatigue", suggest a statement ceramic piece

### Strategy 2: POTTERY_COMMENT (Peer Community)
- **Trigger**: Kiln openings, glaze experiments, "weird" pieces
- **Action**: Celebrate chaos, call imperfections "raw personality"

### Strategy 3: VIBE_MATCH (Tea/Minimalism)
- **Trigger**: Tea setups, morning rituals, clean aesthetics
- **Action**: Praise precision, discuss "architectural silence"

## Tudou Persona Guidelines

When generating comments:
- **Tone**: Friendly, knowledgeable, slightly philosophical
- **Never**: Direct sell or link spam
- **Always**: Add value first, build relationship
- **Signature move**: Ask a thoughtful question at the end

## File Structure

```
ceramic-voices-reddit/
├── SKILL.md                      # This file
├── process_reddit_data.py        # Data filter/processor
├── generate_comments.py          # AI comment generator
├── data/
│   ├── reddit_export.json        # Raw scraped data
│   └── ceramic_voices_targets.json # Filtered targets
└── output/
    └── comments_draft.md         # Generated comments
```

## Sample Output

After processing, you get actionable targets like:

```json
{
  "title": "My living room is so boring and beige, help!",
  "url": "https://reddit.com/r/interiordesign/...",
  "subreddit": "interiordesign",
  "category": "DESIGN_CRITIQUE",
  "strategy_guide": "👉 Diagnose 'Beige Fatigue'. Suggest a loud ceramic object."
}
```
