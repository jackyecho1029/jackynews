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

const POST_DELAY_MS = 2500;
const MAX_RETRIES = 2;

interface CommentResult {
    post_title: string;
    post_url: string;
    subreddit: string;
    score: number;
    category: string;
    image_description: string;
    comments: {
        option_1_sassy: string;
        option_2_deep: string;
        option_3_punchy: string;
    };
}

async function generateImageDescription(title: string, subreddit: string, retryCount = 0): Promise<string> {
    const prompt = `Based on this Reddit post from r/${subreddit}:
Title: "${title}"

Imagine what image would accompany this post. Write a SHORT (1-2 sentences) visual description.
Just output the description, nothing else.`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            console.log(`      ⚠️ Image retry ${retryCount + 1}...`);
            await new Promise(r => setTimeout(r, 1500));
            return generateImageDescription(title, subreddit, retryCount + 1);
        }
        return 'Unable to generate';
    }
}

async function generateComment(title: string, subreddit: string, imageDesc: string, retryCount = 0): Promise<{
    option_1_sassy: string;
    option_2_deep: string;
    option_3_punchy: string;
}> {
    const prompt = `You are "Tudou", a ceramic curator from Jingdezhen. Sophisticated, eccentric, "toxic" humor.
Hate boring beige. Love extreme precision OR chaos.

RULES: No bot-speak. Bold opinions. Under 2 sentences each.

POST: r/${subreddit} - "${title}"
IMAGE: ${imageDesc}

Write 3 comments as JSON:
{"option_1_sassy": "...", "option_2_deep": "...", "option_3_punchy": "..."}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON');
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            console.log(`      ⚠️ Comment retry ${retryCount + 1}...`);
            await new Promise(r => setTimeout(r, 1500));
            return generateComment(title, subreddit, imageDesc, retryCount + 1);
        }
        return {
            option_1_sassy: "[Failed]",
            option_2_deep: "[Failed]",
            option_3_punchy: "[Failed]"
        };
    }
}

async function main() {
    console.log('\n🔄 Ceramic Voices - Retry Failed Posts\n');
    console.log('='.repeat(60));

    const INPUT_FILE = path.join(__dirname, 'output/full_comments.json');
    const OUTPUT_JSON = path.join(__dirname, 'output/full_comments.json');
    const OUTPUT_MD = path.join(__dirname, 'output/full_comments_draft.md');

    if (!fs.existsSync(INPUT_FILE)) {
        console.log('❌ No previous results found.');
        process.exit(1);
    }

    const allResults: CommentResult[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

    // Find failed ones
    const failedIndices: number[] = [];
    allResults.forEach((r, i) => {
        if (r.comments.option_1_sassy.includes('Retry') ||
            r.comments.option_1_sassy.includes('Failed') ||
            r.comments.option_1_sassy.includes('failed') ||
            r.image_description.includes('Unable')) {
            failedIndices.push(i);
        }
    });

    console.log(`📊 Total: ${allResults.length} | Failed: ${failedIndices.length} | Success: ${allResults.length - failedIndices.length}`);
    console.log('='.repeat(60) + '\n');

    if (failedIndices.length === 0) {
        console.log('✅ No failed posts to retry!');
        return;
    }

    console.log(`🔄 Retrying ${failedIndices.length} failed posts...\n`);

    let successCount = 0;

    for (let i = 0; i < failedIndices.length; i++) {
        const idx = failedIndices[i];
        const post = allResults[idx];

        console.log(`[${i + 1}/${failedIndices.length}] ${post.post_title.substring(0, 45)}...`);

        // Regenerate image description if needed
        if (post.image_description.includes('Unable')) {
            console.log('   📷 Regenerating image description...');
            post.image_description = await generateImageDescription(post.post_title, post.subreddit);
        }

        // Regenerate comments
        console.log('   💬 Regenerating comments...');
        post.comments = await generateComment(post.post_title, post.subreddit, post.image_description);

        if (!post.comments.option_1_sassy.includes('Failed')) {
            successCount++;
            console.log('   ✅ Success!');
        } else {
            console.log('   ❌ Still failed');
        }

        await new Promise(r => setTimeout(r, POST_DELAY_MS));
        console.log('');
    }

    // Generate updated Markdown
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
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(allResults, null, 2), 'utf-8');
    fs.writeFileSync(OUTPUT_MD, md, 'utf-8');

    const totalSuccess = allResults.filter(r =>
        !r.comments.option_1_sassy.includes('Failed') &&
        !r.comments.option_1_sassy.includes('Retry')
    ).length;

    console.log('='.repeat(60));
    console.log(`✅ Retry complete! Fixed: ${successCount}/${failedIndices.length}`);
    console.log(`📊 Total success now: ${totalSuccess}/${allResults.length}`);
    console.log(`📝 Output: ${OUTPUT_MD}`);
    console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
