#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🧠 Synthetic AI Search Query Generator (Local Version)
Based on Britney Muller's Colab Notebook
Ported & Adapted by Potato for Gemini 3 Flash & Real Reddit Mining

功能：
1. 来源选择：纯 AI 模拟生成的种子问题 OR 挖掘真实 Reddit 用户提问
2. 将每个问题裂变成 5-10 个不同语气的搜索查询
3. 导出 Excel 表格供 SEO 和内容选题使用
"""

import os
import sys
import io
import time
import json
import requests
import pandas as pd
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def load_environment():
    """加载环境变量"""
    # 尝试加载当前目录的 .env
    load_dotenv()
    
    # 尝试加载项目根目录的 .env.local
    root_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'potatoblog', '.env.local')
    if os.path.exists(root_env):
        load_dotenv(root_env)

def get_gemini_api_key():
    """获取 Gemini API Key"""
    load_environment()
    api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY') or os.environ.get('gemini_api_key')
    
    if not api_key:
        print("❌ 找不到 Gemini API Key。请在 .env 或环境变量中设置 GEMINI_API_KEY。")
        sys.exit(1)
    return api_key

def fetch_reddit_questions_json(keyword, subreddits, limit=50):
    """从 Reddit JSON 接口搜索真实用户问题 (Keyless Mode)"""
    print(f"🕵️ 正在 Reddit ({', '.join(subreddits)}) 搜索关于 '{keyword}' 的真实提问 (JSON Mode)...")
    
    questions = []
    seen_titles = set()
    
    # 模拟浏览器 User-Agent，避免 429/403
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    
    for sub_name in subreddits:
        try:
            print(f"   🔍 扫描 r/{sub_name}...")
            # 使用 search.json 接口
            # restrict_sr=1: 限制在当前 subreddit
            # sort=relevance: 相关度排序
            url = f"https://www.reddit.com/r/{sub_name}/search.json"
            params = {
                'q': keyword,
                'restrict_sr': '1',
                'sort': 'relevance',
                'limit': limit,
                'self': 'yes' # 仅文本帖
            }
            
            response = requests.get(url, headers=headers, params=params, timeout=10)
            
            if response.status_code != 200:
                print(f"   ⚠️ 请求失败 r/{sub_name}: {response.status_code}")
                continue
                
            data = response.json()
            posts = data.get('data', {}).get('children', [])
            
            if not posts:
                print(f"   ⚠️ r/{sub_name} 未找到相关内容。")
                continue

            count = 0
            for post_item in posts:
                post = post_item.get('data', {})
                title = post.get('title', '')
                
                if title in seen_titles:
                    continue
                
                # 简单过滤：标题含问号，或者以疑问词开头
                is_question = '?' in title or any(title.lower().startswith(x) for x in ['how', 'what', 'why', 'can', 'is', 'does', 'where'])
                
                if is_question:
                    questions.append({
                        "title": title,
                        "score": post.get("score", 0),
                        "comments": post.get("num_comments", 0)
                    })
                    seen_titles.add(title)
                    count += 1
                    print(f"      📝 找到 ({post.get('score', 0)}赞): {title[:60]}...")
            
            print(f"   ✅ r/{sub_name} 提取了 {count} 个问题。")
            time.sleep(1) # 礼性延迟
            
        except Exception as e:
            print(f"   ⚠️ 扫描 r/{sub_name} 出错: {e}")

    # 按分数排序
    questions.sort(key=lambda x: x['score'], reverse=True)
    print(f"✅ 共收集到 {len(questions)} 个真实问题。")
    return questions

def generate_synthetic_seeds(model, keyword, num_seeds=20):
    """使用 AI 模拟生成 Reddit 风格的种子问题"""
    print(f"🌱 正在生成关于 '{keyword}' 的 {num_seeds} 个合成种子问题...")
    
    prompt = f"""
    你是一位 Reddit 深度用户和市场调研专家。
    请生成 {num_seeds} 个关于「{keyword}」话题的真是用户提问。
    
    返回 JSON 数组 of objects: [{{"title": "Question...", "score": 10, "comments": 5}}, ...]
    假装这些问题有不同的热度 (score 1-100)。
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith('```json'):
            text = text[7:-3]
        if text.startswith('```'):
            text = text[3:-3]
            
        questions = json.loads(text)
        # Ensure format
        formatted = []
        for q in questions:
            if isinstance(q, str):
                formatted.append({"title": q, "score": 50, "comments": 10})
            else:
                formatted.append(q)
        return formatted[:num_seeds]
        return questions[:num_seeds]
    except Exception as e:
        print(f"❌ AI 生成失败: {e}")
        return []

def generate_synthetic_queries(model, seeds):
    """将种子问题裂变成多维度搜索查询，并进行需求评分"""
    print(f"🚀 正在裂变 {len(seeds)} 个种子问题...")
    
    results = []
    
    # 批量处理，每 5 个问题一组
    batch_size = 5
    for i in range(0, len(seeds), batch_size):
        batch = seeds[i:i+batch_size]
        print(f"   处理批次 {i//batch_size + 1}/{(len(seeds)-1)//batch_size + 1}...")
        
        # 转换 batch 格式为 AI 可读文本
        batch_text = json.dumps(batch, ensure_ascii=False, indent=2)
        
        prompt = f"""
        作为搜索意图和内容策略专家，请将以下每个用户真实问题扩展为 5 个不同的搜索查询变体，并评估其需求潜力。
        每个种子问题包含：Original Title, Reddit Score (热度), Comments (讨论度)。
        
        输入问题列表：
        {batch_text}
        
        任务：
        对于每个种子问题，生成 5 个变体，并为每个变体打分 (1-10)。
        评分标准 (Synthetic Query Score)：
        - 基于 **种子问题的 Reddit 热度** (高赞/高评代表真实痛点)。
        - 基于 **查询变体的搜索意图** (Transactional/How-to 通常比 Navigational 更有内容价值)。
        - 1分：低需求/过于冷门。
        - 10分：高需求/热门痛点/极佳的内容选题。
        
        输出格式要求：只能返回 JSON 格式，结构如下：
        [
            {{
                "original_question": "原始问题标题",
                "variations": [
                    {{"query": "变体1", "type": "Informational", "score": 8, "reason": "高热度痛点"}},
                    {{"query": "变体2", "type": "Transactional", "score": 9, "reason": "强购买意图"}},
                    ...
                ]
            }},
            ...
        ]
        """
        
        try:
            response = model.generate_content(prompt)
            text = response.text.strip()
            # Clean up markdown code blocks if present
            if text.startswith('```json'):
                text = text.replace('```json', '').replace('```', '')
            elif text.startswith('```'):
                text = text.replace('```', '')
            
            # 移除可能的 JSON 错误 (有时候 AI 会返回 weird formatting)
            text = text.strip()
                
            batch_results = json.loads(text)
            results.extend(batch_results)
            time.sleep(1) # 避免速率限制
        except Exception as e:
            print(f"   ⚠️ 批次处理出错: {e}")
            # 打印错误响应以便调试
            # print(text)
            
    return results

def save_to_excel(keyword, data, output_dir):
    """保存结果到 Excel"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    filename = f"{keyword.replace(' ', '_')}_synthetic_queries_{timestamp}.xlsx"
    filepath = os.path.join(output_dir, filename)
    
    rows = []
    for item in data:
        original = item.get("original_question", "")
        # Handle simple string input (legacy/AI mode) or dict input
        if isinstance(original, dict):
            original = original.get("title", "")
            
        for var in item.get("variations", []):
            # 兼容旧格式 (list of strings) 和新格式 (list of dicts)
            if isinstance(var, str):
                rows.append({
                    "Seed Question": original,
                    "Synthetic Query": var,
                    "Type": "Unknown",
                    "Score": 5,
                    "Reason": "Legacy format"
                })
            else:
                rows.append({
                    "Seed Question": original,
                    "Synthetic Query": var.get("query"),
                    "Type": var.get("type"),
                    "Score": var.get("score"),
                    "Reason": var.get("reason"),
                    "Length": len(var.get("query", ""))
                })
            
    df = pd.DataFrame(rows)
    # 按分数排序
    if not df.empty and 'Score' in df.columns:
        df = df.sort_values(by='Score', ascending=False)
        
    df.to_excel(filepath, index=False)
    print(f"💾 结果已保存: {filepath}")
    return filepath

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Synthetic AI Search Query Generator')
    parser.add_argument('keyword', type=str, help='Topic keyword (e.g., "Ceramic Vases")')
    parser.add_argument('--source', type=str, choices=['ai', 'reddit'], default='ai', help='Source of seed questions: "ai" (synthetic) or "reddit" (real)')
    parser.add_argument('--seeds', type=int, default=20, help='Number of seed questions (for AI source)')
    parser.add_argument('--subreddits', type=str, default='AskReddit,Google', help='Comma-separated subreddits to search (for Reddit source)')
    parser.add_argument('--limit', type=int, default=50, help='Search limit per subreddit')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🧠 Synthetic AI Search Query Generator")
    print(f"🎯 目标关键词: {args.keyword}")
    print(f"🔌 种子来源: {args.source.upper()}")
    if args.source == 'reddit':
        print(f"🌍 目标 Subreddits: {args.subreddits}")
    print("=" * 60)
    
    # Init Gemini
    api_key = get_gemini_api_key()
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-3-flash-preview') # Updated to 3 Flash Preview as requested
    
    # 1. Generate/Fetch Seeds
    seeds = []
    if args.source == 'reddit':
        # Removed PRAW client init
        sub_list = [s.strip() for s in args.subreddits.split(',')]
        seeds = fetch_reddit_questions_json(args.keyword, sub_list, args.limit)
        if len(seeds) < 5:
            print("⚠️ 找到的真实问题太少，建议增加搜索范围或切换到 AI 模式。")
    else:
        seeds = generate_synthetic_seeds(model, args.keyword, args.seeds)

    if not seeds:
        print("❌ 无法获取种子问题，程序终止。")
        return

    # 2. Expand Queries
    expanded_data = generate_synthetic_queries(model, seeds)
    
    # 3. Save
    output_dir = os.path.join(os.path.dirname(__file__), 'data')
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    save_to_excel(args.keyword, expanded_data, output_dir)
    
    print("=" * 60)
    print("✅ 任务完成！")

if __name__ == "__main__":
    main()
