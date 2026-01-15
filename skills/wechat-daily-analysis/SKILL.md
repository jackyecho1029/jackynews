---
name: wechat-daily-analysis
description: "Automates the daily WeChat group analysis workflow, including generating daily HTML/PNG reports, updating the monthly Journal publication, and refreshing cumulative operations data. Use this when the user wants to process today's or a specific date's WeChat chat history."
license: Proprietary
---

# WeChat Daily Analysis Workflow

## Overview

This skill standardizes the daily processing of WeChat group chat history. It transforms raw chat logs into a set of polished deliverables:
1.  **Daily Report**: A visual HTML dashboard and a shareable PNG long image.
2.  **Journal Publication**: An updated markdown index with daily golden quotes and action advice.
3.  **Operations Report**: A cumulative analysis of user activity and community health.

## Prerequisites

- **Working Directory**: `D:\Antigravity\Jackypotato\wechat_data`
- **Environment**: Node.js with `tsx` installed.
- **Data Source**: SQLite databases in `EchoTrace` directory (processed automatically).

## Workflow Steps

Run the following steps in order.

### 1. Generate Daily Report (Core)

This is the primary step. It analyzes the chat history for a specific date, generates the content using Gemini AI, and outputs both HTML and PNG files.

**Command:**
```powershell
# Replace [DATE] with the target date (YYYY-MM-DD), e.g., 2026-01-16
cmd /c "npx tsx scripts/analyze-wechat.ts --date=[DATE]"
```

**Outputs:**
- `reports/[DATE]/daily-report.html` (Interactive Dashboard)
- `reports/[DATE]/daily-report.png` (Shareable Long Image)
- `reports/[DATE]/daily-report.md` (Raw Markdwon)

### 2. Update Journal Index (Publication)

This step aggregates the newly generated daily report into the monthly Journal index. It extracts the "One-Sentence Summary" (Golden Quote) and updates the directory.

**Command:**
```powershell
cmd /c "npx tsx scripts/update-journal.ts"
```

**Outputs:**
- `journal/[YYYY-MM]-index.md` (Updated Monthly Publication)
- `journal/README.md` (Master Index)

### 3. Update Operations Report (Cumulative)

This step processes all historical data to update user profiles and community health metrics. Run this to keep the "Big Picture" view current.

**Command:**
```powershell
cmd /c "npx tsx scripts/generate-ops-report.ts"
```

**Outputs:**
- `reports/ops-report.md` (Cumulative Operations Report)

## Verification

After running the workflow, verify the following:
1.  **Check Image**: Open the generated PNG in `reports/[DATE]/` to ensure layout and rendering are correct.
2.  **Check Index**: Open `journal/[YYYY-MM]-index.md` to see if the new date appears with a correct summary quote.

## Troubleshooting

- **Missing Data**: If the analysis finds 0 messages, check if the chat history for that date exists in the database.
- **Puppeteer Timeout**: If PNG generation fails, the HTML report is still valid. You can try running the command again or manually taking a screenshot of the HTML.
