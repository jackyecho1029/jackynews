import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../potatoblog/.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// ========== CONFIGURATION ==========
const BATCH_SIZE = 5;           // 每批处理 5 个帖子
const BATCH_DELAY_MS = 3000;    // 每批之间等待 3 秒
const POST_DELAY_MS = 2000;     // 每个帖子之间等待 2 秒
const MAX_POSTS = 20;           // 最多处理 20 个帖子
const MAX_RETRIES = 2;          // 失败时最多重试 2 次
// ====================================

interface Target {
    title: string;
    url: string;
    subreddit: string;
    score: number;
    category: string;
    strategy_guide: string;
    matched_keyword: string;
    context_text: string;
    post_body?: string;
    image_description?: string;
}

async function generateImageDescription(target: Target, retryCount = 0): Promise<string> {
    const prompt = `Based on this Reddit post from r/${target.subreddit}:
Title: "${target.title}"

Imagine what image would accompany this post. Write a SHORT (1-2 sentences) visual description.
Examples:
- "A rustic mug with uneven glaze and earthy tones"
- "A pristine white teapot with sharp geometric lines"

Just output the description, nothing else.`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            console.log(`      ⚠️ Retry ${retryCount + 1}/${MAX_RETRIES}...`);
            await new Promise(r => setTimeout(r, 1000));
            return generateImageDescription(target, retryCount + 1);
        }
        return 'Unable to generate description';
    }
}

async function generateComment(target: Target, retryCount = 0): Promise<{
    option_1_sassy: string;
    option_2_deep: string;
    option_3_punchy: string;
}> {
    const prompt = `You are "Tudou", a ceramic curator from Jingdezhen. You're sophisticated, eccentric, and "toxic" in a humorous way.
You hate boring beige and soulless mass production. You love extreme precision OR extreme chaos.

RULES:
- NO "Bot-speak" like "Nice pic!" or "Great work!"
- Be bold and opinionated
- Keep comments under 2 sentences

POST CONTEXT:
Subreddit: r/${target.subreddit}
Title: ${target.title}
Image shows: ${target.image_description || 'pottery/ceramics'}

Write 3 SHORT comments:
1. Sassy/Funny - reference specific visual
2. Deep/Aesthetic - philosophical take
3. Short/Punchy - quick reaction

Output JSON only:
{"option_1_sassy": "...", "option_2_deep": "...", "option_3_punchy": "..."}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON');
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            console.log(`      ⚠️ Comment retry ${retryCount + 1}/${MAX_RETRIES}...`);
            await new Promise(r => setTimeout(r, 1000));
            return generateComment(target, retryCount + 1);
        }
        return {
            option_1_sassy: "[Failed after retries]",
            option_2_deep: "[Failed after retries]",
            option_3_punchy: "[Failed after retries]"
        };
    }
}

async function processBatch(targets: Target[], batchNum: number, totalBatches: number): Promise<any[]> {
    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${targets.length} posts)`);
    console.log('-'.repeat(50));

    const results: any[] = [];

    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        console.log(`   [${i + 1}/${targets.length}] ${target.title.substring(0, 40)}...`);

        // Generate image description
        target.image_description = await generateImageDescription(target);

        // Generate comments
        const comments = await generateComment(target);

        results.push({
            post_title: target.title,
            post_url: target.url,
            subreddit: target.subreddit,
            score: target.score,
            category: target.category,
            image_description: target.image_description,
            comments
        });

        await new Promise(r => setTimeout(r, POST_DELAY_MS));
    }

    return results;
}

async function main() {
    console.log('\n🔥 Ceramic Voices - Full Pipeline (Batch Mode)\n');
    console.log('='.repeat(60));
    console.log(`⚙️  Batch Size: ${BATCH_SIZE} | Delay: ${BATCH_DELAY_MS}ms | Max: ${MAX_POSTS}`);
    console.log('='.repeat(60));

    const INPUT_FILE = path.join(__dirname, 'data/ceramic_voices_targets.json');
    const OUTPUT_JSON = path.join(__dirname, 'output/full_comments.json');
    const OUTPUT_MD = path.join(__dirname, 'output/full_comments_draft.md');

    if (!fs.existsSync(INPUT_FILE)) {
        console.log('❌ No targets file. Run: npx tsx process_reddit_data.ts');
        process.exit(1);
    }

    const allTargets: Target[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
    const targets = allTargets.slice(0, MAX_POSTS);

    console.log(`📥 Total: ${allTargets.length} | Processing: ${targets.length}\n`);

    // Split into batches
    const batches: Target[][] = [];
    for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        batches.push(targets.slice(i, i + BATCH_SIZE));
    }

    const allResults: any[] = [];

    for (let b = 0; b < batches.length; b++) {
        const batchResults = await processBatch(batches[b], b + 1, batches.length);
        allResults.push(...batchResults);

        if (b < batches.length - 1) {
            console.log(`\n⏳ Waiting ${BATCH_DELAY_MS / 1000}s before next batch...`);
            await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
        }
    }

    // Generate Markdown
    let md = `# 🔥 Ceramic Voices - Reddit Comments

Generated: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
Total: ${allResults.length} posts

---

`;

    for (const r of allResults) {
        md += `## 📌 ${r.post_title}

**r/${r.subreddit}** | Score: ${r.score} | [Open →](${r.post_url})

**🖼️ Image:** ${r.image_description}

| 🎭 Sassy | ${r.comments.option_1_sassy} |
|----------|------------------------------|
| 🪷 Deep | ${r.comments.option_2_deep} |
| ⚡ Punchy | ${r.comments.option_3_punchy} |

---

`;
    }

    // Save
    fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allResults, null, 2), 'utf-8');
    fs.writeFileSync(OUTPUT_MD, md, 'utf-8');

    const successCount = allResults.filter(r =>
        !r.comments.option_1_sassy.includes('Retry') && !r.comments.option_1_sassy.includes('failed')
    ).length;

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Done! Success: ${successCount}/${allResults.length}`);
    console.log(`📝 Output: ${OUTPUT_MD}`);
    console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
