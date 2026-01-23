import json
import os
import re
from datetime import datetime

class CeramicFilter:
    def __init__(self):
        # 🟢 Strategy 1: Design Critique (寻找无聊的房间)
        self.logic_design = {
            "name": "DESIGN_CRITIQUE",
            "subreddits": ["interiordesign", "malelivingspace", "homedecorating", "amateurroomporn", "designmyroom", "interior"],
            "keywords": [
                "advice", "boring", "missing something", "too white", "beige", 
                "empty", "suggestions", "help", "bland", "sterile", "hospital",
                "need ideas", "what should", "recommendations"
            ],
            "action_hint": "👉 Strategy: Diagnose 'Beige Fatigue'. Suggest a loud [Ceramic Voices] object to break the silence."
        }

        # 🟣 Strategy 2: Pottery Appreciation (寻找怪诞/同行)
        self.logic_pottery = {
            "name": "POTTERY_COMMENT",
            "subreddits": ["pottery", "ceramics", "potterymaking", "clay"],
            "keywords": [
                "kiln", "glaze", "weird", "fail", "experimental", 
                "texture", "first", "wild", "test", "wonky", "monster",
                "proud", "finally", "attempt", "celebrating", "made"
            ],
            "action_hint": "👉 Strategy: If weird, celebrate the chaos (Designer B vibe). Compliment technique genuinely."
        }

        # ⚪ Strategy 3: Vibe Match (寻找极简/茶)
        self.logic_vibe = {
            "name": "VIBE_MATCH",
            "subreddits": ["tea", "gongfutea", "minimalism", "zenhabits", "teaporn"],
            "keywords": [
                "setup", "corner", "morning", "calm", "collection", 
                "white", "black", "zen", "clean", "lines", "sharp",
                "ritual", "peaceful", "aesthetic", "teapot", "mug"
            ],
            "action_hint": "👉 Strategy: Praise the precision (Designer A vibe). Talk about 'Anxiety Relief' or 'Architectural Silence'."
        }

    def clean_text(self, text):
        """简单的文本清洗"""
        if not text:
            return ""
        return str(text).lower()

    def extract_subreddit(self, post):
        """从 URL 或 subreddit 字段提取板块名"""
        # 先检查直接的 subreddit 字段
        if post.get('subreddit'):
            sub = post['subreddit'].replace('r/', '').lower()
            return sub
        
        # 从 URL 提取
        url = post.get('url', '') or post.get('link', '')
        match = re.search(r'/r/([^/]+)', url)
        if match:
            return match.group(1).lower()
        
        return ""

    def check_match(self, post):
        """核心匹配逻辑"""
        title = self.clean_text(post.get('title', ''))
        body = self.clean_text(post.get('body', '') or post.get('selftext', '') or post.get('description', ''))
        subreddit = self.extract_subreddit(post)
        
        full_text = f"{title} {body}"
        
        # 依次检查三个策略
        strategies = [self.logic_design, self.logic_pottery, self.logic_vibe]
        
        for strategy in strategies:
            # 1. 检查板块是否匹配
            is_sub_match = False
            for target_sub in strategy['subreddits']:
                if target_sub in subreddit:
                    is_sub_match = True
                    break
            
            if not is_sub_match:
                continue
            
            # 2. 检查关键字 (必须命中至少一个)
            is_keyword_match = False
            matched_keyword = ""
            for kw in strategy['keywords']:
                if kw in full_text:
                    is_keyword_match = True
                    matched_keyword = kw
                    break
            
            # 判定：如果是目标板块 且 命中关键字 -> 选中
            if is_sub_match and is_keyword_match:
                return {
                    "matched": True,
                    "category": strategy['name'],
                    "hint": strategy['action_hint'],
                    "matched_keyword": matched_keyword
                }
        
        # 如果是目标板块但没有关键字匹配，仍然标记为潜在目标
        for strategy in strategies:
            for target_sub in strategy['subreddits']:
                if target_sub in subreddit:
                    return {
                        "matched": True,
                        "category": strategy['name'] + "_GENERAL",
                        "hint": f"👉 General post in target subreddit. Review manually for engagement opportunity.",
                        "matched_keyword": "subreddit_match"
                    }
                
        return {"matched": False}

    def process_data(self, data, output_path):
        """处理数据列表"""
        results = []
        
        print(f"📥 Loaded {len(data)} posts. Filtering for [Ceramic Voices]...")

        for post in data:
            match_result = self.check_match(post)
            
            if match_result['matched']:
                # 重组数据
                processed_post = {
                    "title": post.get('title'),
                    "url": post.get('url') or post.get('link'),
                    "subreddit": self.extract_subreddit(post),
                    "score": post.get('score', 0),
                    "category": match_result['category'],
                    "strategy_guide": match_result['hint'],
                    "matched_keyword": match_result.get('matched_keyword', ''),
                    "context_text": f"{post.get('title', '')}"
                }
                results.append(processed_post)

        # 按分数排序
        results.sort(key=lambda x: x.get('score', 0), reverse=True)

        # 输出结果
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
            
        print(f"✅ Filter complete. Found {len(results)} actionable targets.")
        print(f"💾 Saved to: {output_path}")
        
        # 打印分类统计
        categories = {}
        for r in results:
            cat = r['category']
            categories[cat] = categories.get(cat, 0) + 1
        
        print("\n📊 Category breakdown:")
        for cat, count in sorted(categories.items()):
            print(f"   {cat}: {count}")
        
        return results

    def process_file(self, input_path, output_path):
        """读取文件并处理"""
        raw_data = []

        try:
            if input_path.endswith('.json'):
                with open(input_path, 'r', encoding='utf-8') as f:
                    raw_data = json.load(f)
            elif input_path.endswith('.csv'):
                import csv
                with open(input_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    raw_data = list(reader)
        except Exception as e:
            print(f"❌ Error reading file: {e}")
            return []

        return self.process_data(raw_data, output_path)


# ==========================================
# 执行入口
# ==========================================
if __name__ == "__main__":
    INPUT_FILE = "data/reddit_export.json"
    OUTPUT_FILE = "data/ceramic_voices_targets.json"
    
    # 如果输入文件不存在，创建示例数据
    if not os.path.exists(INPUT_FILE):
        print(f"⚠️ Warning: {INPUT_FILE} not found. Creating sample data...")
        os.makedirs("data", exist_ok=True)
        sample_data = [
            {"title": "My 2025 projects", "subreddit": "pottery", "url": "https://www.reddit.com/r/pottery/comments/1q1625r/", "score": 3528},
            {"title": "Celebrating 6 months of pottery", "subreddit": "pottery", "url": "https://www.reddit.com/r/pottery/comments/1q3t2jr/", "score": 2390},
            {"title": "New place means I finally have a spot for my teapots!", "subreddit": "tea", "url": "https://www.reddit.com/r/tea/comments/1q5chil/", "score": 1485},
        ]
        with open(INPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(sample_data, f, indent=2)

    processor = CeramicFilter()
    processor.process_file(INPUT_FILE, OUTPUT_FILE)
