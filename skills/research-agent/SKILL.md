---
description: Mining real user questions from Reddit and generating synthetic search queries using AI.
---

# Research Agent: Reddit Miner & Query Generator

This skill leverages a local Python tool to mine **real** user questions from Reddit (without API keys) and uses Gemini AI to expand them into hundreds of high-value search queries.

## 🌟 Capabilities
- **Real Question Mining**: Scrapes "Keyless" JSON feeds from specified Subreddits to find authentic user problems.
- **Demand Scoring**: Captures Reddit upvotes/comments and uses AI to potential "content demand" (1-10 Score) for each variation.
- **Synthetic Expansion**: Uses Gemini 3 Flash to multiply each question into 5 variations (Informational, Transactional, etc.).
- **Excel Export**: Delivers a ready-to-use content plan in `.xlsx` format with sorting by potential impact.

## 🛠️ Setup
1. **Dependencies**: Ensure requirements are installed.
   ```powershell
   pip install -r tools/Research/requirements.txt
   ```
2. **Environment**: Ensure `potatoblog/.env.local` has a valid `GEMINI_API_KEY`.

## 🚀 Usage

### 1. Basic Usage (AI Only)
Generate questions purely with AI (good for general topics).
```powershell
python tools/Research/synthetic_query_generator.py "Your Topic"
```

### 2. Reddit Mining (Recommended)
Mine real questions from specific communities.
```powershell
python tools/Research/synthetic_query_generator.py "glaze defects" --source reddit --subreddits Pottery,Ceramics
```

### 3. Arguments
| Argument | Description | Default |
| :--- | :--- | :--- |
| `keyword` | Main topic to research | (Required) |
| `--source` | `reddit` or `ai` | `ai` |
| `--subreddits` | Comma-separated list (e.g. `Pottery,Clay`) | `AskReddit,Google` |
| `--limit` | Max posts to scan per subreddit | `50` |
| `--seeds` | Number of seeds (only for AI mode) | `20` |

## 📂 Output
Results are saved to: `tools/Research/data/`
Format: `Keyword_synthetic_queries_YYYYMMDD_HHMM.xlsx`

## 💡 Best Practices
- **Topics**: Use specific problems (e.g., "glaze crawling" vs "glaze").
- **Subreddits**: Choose active, niche communities.
- **Volume**: Increase `--limit 100` if you aren't finding enough questions.
