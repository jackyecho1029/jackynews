
import praw
import os
import time
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)

class RedditRadar:
    def __init__(self):
        # Load environment variables
        env_path = os.path.join(os.path.dirname(__file__), '.env')
        load_dotenv(env_path)
        
        self.client_id = os.getenv('REDDIT_CLIENT_ID')
        self.client_secret = os.getenv('REDDIT_CLIENT_SECRET')
        self.user_agent = os.getenv('REDDIT_USER_AGENT', 'RedditRadar/1.0')
        
        if not self.client_id or not self.client_secret:
            raise ValueError("Missing Reddit API credentials. Please check your .env file.")

        print(f"{Fore.CYAN}📡 Initializing Reddit Radar...{Style.RESET_ALL}")
        self.reddit = praw.Reddit(
            client_id=self.client_id,
            client_secret=self.client_secret,
            user_agent=self.user_agent
        )
        
        self.target_subreddits = ['Pottery', 'Ceramics', 'Tea', 'InteriorDesign', 'SlowLiving']
        self.time_window_days = 3
        
        # Search Patterns
        self.patterns = {
            "🚨 NEEDS (High Intent)": ["looking for", "recommend", "where to buy", "gift for"],
            "😫 PAIN (Opportunities)": ["broke", "hard to clean", "handle", "heavy", "chipped"],
            "🧘 SANITY (Viral/Emotion)": ["sanity", "obsessed", "ritual", "calm", "therapy"]
        }
        
        self.findings = []

    def scan(self):
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=self.time_window_days)
        print(f"{Fore.YELLOW}🕒 Scanning for posts since: {cutoff_date.strftime('%Y-%m-%d')}{Style.RESET_ALL}")
        
        for sub_name in self.target_subreddits:
            print(f"\n🔍 Scanning r/{sub_name}...")
            subreddit = self.reddit.subreddit(sub_name)
            
            # We scan 'new' to get recent stuff, or 'search' to filter?
            # 'search' API is better if we have specific keywords. 
            # But iterating 'new' is better to catch EVERYTHING if volume is low.
            # Given these are niche subs, 'new' for 3 days is feasible and more comprehensive.
            # Let's try iterating 'new' first.
            
            try:
                # Limit to 100 to be safe, but loop until date cutoff
                for post in subreddit.new(limit=200):
                    post_date = datetime.fromtimestamp(post.created_utc, timezone.utc)
                    
                    if post_date < cutoff_date:
                        break # Stop if we go past the window
                    
                    self.analyze_post(post, sub_name)
                    
            except Exception as e:
                print(f"{Fore.RED}Error scanning r/{sub_name}: {e}{Style.RESET_ALL}")

    def analyze_post(self, post, sub_name):
        content = (post.title + " " + post.selftext).lower()
        
        for category, keywords in self.patterns.items():
            for keyword in keywords:
                if keyword in content:
                    print(f"   {Fore.GREEN}Found match:{Style.RESET_ALL} [{category}] {keyword} -> {post.title[:50]}...")
                    self.findings.append({
                        'subreddit': sub_name,
                        'title': post.title,
                        'url': post.url,
                        'match_category': category,
                        'match_keyword': keyword,
                        'score': post.score,
                        'comments': post.num_comments,
                        'created': datetime.fromtimestamp(post.created_utc).strftime('%Y-%m-%d')
                    })
                    return # Avoid double counting same post for multiple keywords (simplification)

    def generate_report(self):
        if not self.findings:
            print(f"\n{Fore.RED}No opportunities found in the last 3 days.{Style.RESET_ALL}")
            return

        report_path = os.path.join(os.path.dirname(__file__), 'report.md')
        
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(f"# 📡 Reddit Radar Report\n")
            f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
            f.write(f"**Window**: Last {self.time_window_days} Days\n\n")
            
            # Group by Category
            grouped = {}
            for item in self.findings:
                cat = item['match_category']
                if cat not in grouped:
                    grouped[cat] = []
                grouped[cat].append(item)
            
            for category, items in grouped.items():
                f.write(f"## {category}\n\n")
                for item in items:
                    f.write(f"- **[{item['match_keyword'].upper()}]** [{item['title']}]({item['url']})\n")
                    f.write(f"  - *r/{item['subreddit']}* | 💬 {item['comments']} | ⬆️ {item['score']}\n")
                f.write("\n")

        print(f"\n{Fore.GREEN}✅ Report generated: {report_path}{Style.RESET_ALL}")

if __name__ == "__main__":
    try:
        radar = RedditRadar()
        radar.scan()
        radar.generate_report()
    except ValueError as ve:
        print(f"{Fore.RED}{ve}{Style.RESET_ALL}")
    except Exception as e:
        print(f"{Fore.RED}An unexpected error occurred: {e}{Style.RESET_ALL}")
