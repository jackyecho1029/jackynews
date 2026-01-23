import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Post {
    title: string;
    subreddit?: string;
    url?: string;
    link?: string;
    score?: number;
    body?: string;
    selftext?: string;
    description?: string;
}

interface MatchResult {
    matched: boolean;
    category?: string;
    hint?: string;
    matched_keyword?: string;
}

interface Strategy {
    name: string;
    subreddits: string[];
    keywords: string[];
    action_hint: string;
}

class CeramicFilter {
    private strategies: Strategy[];

    constructor() {
        // 🟢 Strategy 1: Design Critique
        const logicDesign: Strategy = {
            name: "DESIGN_CRITIQUE",
            subreddits: ["interiordesign", "malelivingspace", "homedecorating", "amateurroomporn", "designmyroom", "interior"],
            keywords: [
                "advice", "boring", "missing something", "too white", "beige",
                "empty", "suggestions", "help", "bland", "sterile", "hospital",
                "need ideas", "what should", "recommendations"
            ],
            action_hint: "👉 Diagnose 'Beige Fatigue'. Suggest a loud ceramic object to break the silence."
        };

        // 🟣 Strategy 2: Pottery Appreciation
        const logicPottery: Strategy = {
            name: "POTTERY_COMMENT",
            subreddits: ["pottery", "ceramics", "potterymaking", "clay"],
            keywords: [
                "kiln", "glaze", "weird", "fail", "experimental",
                "texture", "first", "wild", "test", "wonky", "monster",
                "proud", "finally", "attempt", "celebrating", "made"
            ],
            action_hint: "👉 Celebrate the chaos (Designer B vibe). Compliment technique genuinely."
        };

        // ⚪ Strategy 3: Vibe Match
        const logicVibe: Strategy = {
            name: "VIBE_MATCH",
            subreddits: ["tea", "gongfutea", "minimalism", "zenhabits", "teaporn"],
            keywords: [
                "setup", "corner", "morning", "calm", "collection",
                "white", "black", "zen", "clean", "lines", "sharp",
                "ritual", "peaceful", "aesthetic", "teapot", "mug"
            ],
            action_hint: "👉 Praise the precision (Designer A vibe). Talk about 'Anxiety Relief' or 'Architectural Silence'."
        };

        this.strategies = [logicDesign, logicPottery, logicVibe];
    }

    private cleanText(text: string | undefined): string {
        return (text || '').toLowerCase();
    }

    private extractSubreddit(post: Post): string {
        if (post.subreddit) {
            return post.subreddit.replace('r/', '').toLowerCase();
        }
        const url = post.url || post.link || '';
        const match = url.match(/\/r\/([^/]+)/);
        return match ? match[1].toLowerCase() : '';
    }

    private checkMatch(post: Post): MatchResult {
        const title = this.cleanText(post.title);
        const body = this.cleanText(post.body || post.selftext || post.description);
        const subreddit = this.extractSubreddit(post);
        const fullText = `${title} ${body}`;

        for (const strategy of this.strategies) {
            // Check subreddit match
            const isSubMatch = strategy.subreddits.some(sub => subreddit.includes(sub));
            if (!isSubMatch) continue;

            // Check keyword match
            let matchedKeyword = '';
            const isKeywordMatch = strategy.keywords.some(kw => {
                if (fullText.includes(kw)) {
                    matchedKeyword = kw;
                    return true;
                }
                return false;
            });

            if (isSubMatch && isKeywordMatch) {
                return {
                    matched: true,
                    category: strategy.name,
                    hint: strategy.action_hint,
                    matched_keyword: matchedKeyword
                };
            }
        }

        // General subreddit match
        for (const strategy of this.strategies) {
            if (strategy.subreddits.some(sub => subreddit.includes(sub))) {
                return {
                    matched: true,
                    category: strategy.name + "_GENERAL",
                    hint: "👉 General post in target subreddit. Review for engagement opportunity.",
                    matched_keyword: "subreddit_match"
                };
            }
        }

        return { matched: false };
    }

    processData(data: Post[], outputPath: string): object[] {
        console.log(`📥 Loaded ${data.length} posts. Filtering for [Ceramic Voices]...\n`);

        const results: object[] = [];

        for (const post of data) {
            const matchResult = this.checkMatch(post);

            if (matchResult.matched) {
                results.push({
                    title: post.title,
                    url: post.url || post.link,
                    subreddit: this.extractSubreddit(post),
                    score: post.score || 0,
                    category: matchResult.category,
                    strategy_guide: matchResult.hint,
                    matched_keyword: matchResult.matched_keyword,
                    context_text: post.title
                });
            }
        }

        // Sort by score
        results.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

        // Save output
        const outputDir = path.dirname(outputPath);
        if (outputDir && !fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

        console.log(`✅ Filter complete. Found ${results.length} actionable targets.`);
        console.log(`💾 Saved to: ${outputPath}\n`);

        // Category breakdown
        const categories: { [key: string]: number } = {};
        for (const r of results) {
            const cat = (r as any).category;
            categories[cat] = (categories[cat] || 0) + 1;
        }

        console.log('📊 Category breakdown:');
        for (const [cat, count] of Object.entries(categories).sort()) {
            console.log(`   ${cat}: ${count}`);
        }

        return results;
    }
}

// Main execution
const INPUT_FILE = path.join(__dirname, 'data/reddit_export.json');
const OUTPUT_FILE = path.join(__dirname, 'data/ceramic_voices_targets.json');

console.log('\n🔥 Ceramic Voices Reddit Processor\n');
console.log('='.repeat(50));

if (!fs.existsSync(INPUT_FILE)) {
    console.log(`❌ Input file not found: ${INPUT_FILE}`);
    process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
const processor = new CeramicFilter();
processor.processData(rawData, OUTPUT_FILE);

console.log('\n' + '='.repeat(50));
console.log('✅ Processing complete!\n');
