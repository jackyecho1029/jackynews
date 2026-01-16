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
- **Environment**: Node.js with `tsx` installed
- **WeChat Database** (Auto-updated): `D:\Wechat\下载\xwechat_files`
- **EchoTrace Mirror** (Synced): `D:\Antigravity\Jackypotato\wechat_data\EchoTrace`

## Data Flow Overview

```
微信数据库 (Real-time)
  ↓ EchoTrace自动同步
D:\Wechat\下载\xwechat_files
  ↓ EchoTrace复制到缓存
D:\Antigravity\Jackypotato\wechat_data\EchoTrace\wxid_xxx\*.db
  ↓ 月度手动导出 (EchoTrace UI)
chathistory/复利日知录第 5 季交流群（2026 ）_[timestamp].json
  ↓ 每日分析脚本
reports/[DATE]/daily-report.html/png/md + journal/ + ops-report.md
```

## Monthly Data Export (Required First Step)

**Frequency**: Once per month (covers entire month)  
**Tool**: EchoTrace Application  

**Steps**:
1. Open EchoTrace 应用程序
2. 确认配置:
   - **数据库根目录**: `D:\Wechat\下载\xwechat_files`
   - **文档缓存目录**: `D:\Antigravity\Jackypotato\wechat_data`
3. Click **"自动检测"** (Auto Detect) to extract messages from database
4. Exported JSON saved to: `chathistory/复利日知录第 5 季交流群（2026 ）_[timestamp].json`

> **💡 Key Point**: One monthly export contains ALL messages for that month. After export, you can analyze ANY specific date within the month without re-exporting.

## Daily Analysis Workflow

### Option A: Real-time Database Extraction (Recommended for Latest Data)

If you need to analyze **today's or very recent data** that hasn't been exported yet, use the database extraction script:

**Step 0: Extract Data from Database**

```powershell
# Extract messages for a specific date directly from database
cmd /c "npx tsx scripts/extract-date.ts [DATE]"
# Example: cmd /c "npx tsx scripts/extract-date.ts 2026-01-16"
```

**What it does:**
- Queries the SQLite database in `EchoTrace\wxid_xxx\message_0.db`
- Extracts messages for the specified date
- Converts to standard JSON format
- Saves to `chathistory/复利日知录第 5 季交流群（2026 ）_fresh_[DATE].json`

**Advantages:**
- ✅ Immediate access to latest data (no need to wait for monthly export)
- ✅ Can analyze any historical date
- ✅ Automated and repeatable

Then proceed with Steps 1-3 below.

### Option B: Monthly JSON Export (Traditional Method)

Use this when analyzing dates that are already covered by the monthly export.

## Daily Analysis Workflow

Run the following steps in order for each date you want to analyze.

### 1. Generate Daily Report (Core)

This is the primary step. It analyzes chat history for a specific date, generates AI-powered content, and outputs HTML and PNG files.

**Command:**
```powershell
# Replace [DATE] with target date (YYYY-MM-DD), e.g., 2026-01-16
cmd /c "npx tsx scripts/analyze-wechat.ts --date=[DATE]"
```

**Outputs:**
- `reports/[DATE]/daily-report.html` (Interactive Dashboard)
- `reports/[DATE]/daily-report.png` (Shareable Long Image)
- `reports/[DATE]/daily-report.md` (Raw Markdown)

**Note**: If you see "No messages found for date: YYYY-MM-DD", the monthly export might not include that date yet. Check "Available dates" in the output.

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

## User Profile & Display Name Configuration

To ensure friendly names are displayed in reports (e.g., "查理·唐" instead of "wxid_btso..."), the system uses a three-layer resolution logic:

### 1. User Alias Mapping (`config/user-aliases.json`)

If a user's nickname is not set in the WeChat database or you want to override it, add a mapping to the local config file:

- **Path**: `wechat_data/config/user-aliases.json`
- **Format**:
```json
{
  "Dwxid_btso0q1vek0j22": "查理·唐",
  "wxid_btso0q1vek0j22": "查理·唐"
}
```

### 2. Display Name Resolution Logic

The scripts (`extract-date.ts`, `extract-from-db.ts`) resolve names in this priority:
1.  **Contact Database**: Check `remark` (备注) then `nickname` (昵称).
2.  **User Aliases**: Check `config/user-aliases.json` for manual overrides.
3.  **WXID Filtering**: If no name is found and the sender looks like a `wxid_` string, it displays as **"群成员"** to keep reports clean.

### 3. Binary Prefix Cleaning

The extraction scripts automatically detect and strip binary garbage characters (e.g., `(/`) that sometimes prefix usernames in the raw message content, ensuring only pure wxids or usernames are used for lookup.

## Verification

After running the workflow, verify the following:
1.  **Check Labels**: Ensure reports show friendly names or "群成员" instead of raw wxid strings.
2.  **Check Image**: Open the generated PNG in `reports/[DATE]/` to ensure layout and rendering are correct.
3.  **Check Index**: Open `journal/[YYYY-MM]-index.md` to see if the new date appears with a correct summary quote.

## Troubleshooting

**Problem**: "No messages found for date: YYYY-MM-DD"
- **Cause**: The monthly JSON export doesn't include that date
- **Solution**: 
  1. Check the "Available dates" shown in error message
  2. Run EchoTrace to export a new monthly file if needed
  3. The exported JSON filename includes a timestamp - use the latest one

**Problem**: Puppeteer timeout during PNG generation
- **Solution**: The HTML report is still valid. Try running the command again, or manually screenshot the HTML file.

**Problem**: Database files not syncing
- **Verify**: EchoTrace is configured correctly with paths shown in "Prerequisites"
- **Verify**: WeChat application is closed when running EchoTrace (it locks the database)

## Real-time Analysis (Latest Data)

You can now analyze **the latest data immediately** without waiting for monthly export:

**For today or recent dates:**
```powershell
# Step 0: Extract from database
cmd /c "npx tsx scripts/extract-date.ts 2026-01-16"

# Step 1-3: Run analysis workflow
cmd /c "npx tsx scripts/analyze-wechat.ts --date=2026-01-16"
cmd /c "npx tsx scripts/update-journal.ts"
cmd /c "npx tsx scripts/generate-ops-report.ts"
```

**Benefits:**
- No need to wait for monthly export
- Analyze data as soon as it appears in the database
- EchoTrace automatically syncs the database in real-time

**Monthly export still useful for:**
- Bulk historical analysis
- Backup and archival purposes
