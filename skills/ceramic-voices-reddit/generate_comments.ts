import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../potatoblog/.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

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

interface GeneratedComment {
    post_title: string;
    post_url: string;
    subreddit: string;
    category: string;
    image_description: string;
    post_body: string;
    comments: {
        option_1_sassy: string;
        option_2_deep: string;
        option_3_punchy: string;
    };
}

const TUDOU_SYSTEM_PROMPT = `### Role:
You are "Tudou", the founder of [Ceramic Voices]. You are a ceramic curator based in Jingdezhen, China.
Your brand persona is: **Sophisticated, slightly eccentric, knowledgeable, and "toxic" in a humorous/sassy way.**
You hate "boring beige" (generic styles) and "soulless mass production".
You love "Extreme Silence" (precision) or "Extreme Chaos" (weird colors).

### Tone Guidelines:
1.  **NO "Bot-speak":** Do not use "Nice pic!", "Great work!", "Check out my profile".
2.  **Be a "Main Character":** Speak with authority. Judge the aesthetics, don't just observe.
3.  **The "Liquid Death" Vibe:** Be bold. If it's boring, say it needs noise. If it's weird, say it's a masterpiece.
4.  **Short:** Keep it under 2 sentences.

### Scenarios:

**Scenario A: If the image shows a "Boring/Beige/Empty" Room:**
*   **Angle:** Diagnose them with "Beige Fatigue". Tell them the room needs an object that screams (color/chaos).
*   *Example:* "This room is so polite it's making me nervous. Throw something red and weird on that table."

**Scenario B: If the image shows "Weird/Ugly/Crazy" Pottery:**
*   **Angle:** Celebrate the ugliness. Call it "personality". Validate their boldness.
*   *Example:* "It looks like a radioactive fruit. I absolutely love it. We need less perfect cups."

**Scenario C: If the image shows "Perfect/Minimalist" Pottery:**
*   **Angle:** Focus on the "Precision" and "Anxiety Relief".
*   *Example:* "The line on that rim is sharper than my future. Satisfying."

**Scenario D: If the post mentions "Jingdezhen" or "Ceramic Technique" (kiln, glaze, firing):**
*   **Angle:** Show respect as a local expert.
*   *Example:* "The reduction firing on this is intense. The kiln gods were kind to you today."

**Scenario E: Tea/Teapot related posts:**
*   **Angle:** Connect ceramics to the ritual, discuss how the vessel changes the experience.
*   *Example:* "A tea corner isn't complete until it has a pot that makes you sigh. This is getting there."`;

async function generateCommentForPost(target: Target): Promise<GeneratedComment> {
    const imageContext = target.image_description
        ? `**Image Description:** ${target.image_description}`
        : '**Image:** (No image description available)';

    const bodyContext = target.post_body
        ? `**Post Text:** ${target.post_body}`
        : '';

    const prompt = `${TUDOU_SYSTEM_PROMPT}

### Input Post Context:
**Subreddit:** r/${target.subreddit}
**Title:** ${target.title}
${imageContext}
${bodyContext}
**Category Hint:** ${target.category}
**Strategy:** ${target.strategy_guide}

### Task:
Based on the title, image description, and post text above, generate 3 Reddit comment options that match the Tudou persona.
- The comments should directly reference what you "see" in the image description.
- Each comment should be 1-2 sentences max.
- Be specific to THIS post, not generic.

### Output:
Format your response as JSON:
{
  "option_1_sassy": "[Sassy/Funny comment - reference the specific visual element]",
  "option_2_deep": "[Deep/Aesthetic comment - philosophical take on what you see]",
  "option_3_punchy": "[Short/Punchy comment - quick reaction]"
}

Only output the JSON, nothing else.`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Could not extract JSON from response');
        }

        const comments = JSON.parse(jsonMatch[0]);

        return {
            post_title: target.title,
            post_url: target.url,
            subreddit: target.subreddit,
            category: target.category,
            image_description: target.image_description || 'N/A',
            post_body: target.post_body || 'N/A',
            comments
        };
    } catch (error) {
        console.error(`❌ Error generating comment for: ${target.title}`);
        return {
            post_title: target.title,
            post_url: target.url,
            subreddit: target.subreddit,
            category: target.category,
            image_description: target.image_description || 'N/A',
            post_body: target.post_body || 'N/A',
            comments: {
                option_1_sassy: "[Generation failed]",
                option_2_deep: "[Generation failed]",
                option_3_punchy: "[Generation failed]"
            }
        };
    }
}

function generateMarkdownOutput(results: GeneratedComment[]): string {
    let md = `# 🔥 Ceramic Voices - Reddit Comment Drafts

Generated: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}

---

`;

    for (const result of results) {
        md += `## 📌 ${result.post_title}

**Subreddit:** r/${result.subreddit} | **Category:** ${result.category}
**Link:** [Open Post](${result.post_url})

**🖼️ Image:** ${result.image_description}

### Comment Options:

**🎭 Option 1 (Sassy/Funny):**
> ${result.comments.option_1_sassy}

**🪷 Option 2 (Deep/Aesthetic):**
> ${result.comments.option_2_deep}

**⚡ Option 3 (Short/Punchy):**
> ${result.comments.option_3_punchy}

---

`;
    }

    return md;
}

async function main() {
    console.log('\n🔥 Ceramic Voices - Enhanced Comment Generator (with Vision Context)\n');
    console.log('='.repeat(60));

    const INPUT_FILE = path.join(__dirname, 'data/ceramic_voices_targets.json');
    const OUTPUT_JSON = path.join(__dirname, 'output/comments.json');
    const OUTPUT_MD = path.join(__dirname, 'output/comments_draft.md');

    if (!fs.existsSync(INPUT_FILE)) {
        console.log('❌ No targets file found. Run process_reddit_data.ts first.');
        process.exit(1);
    }

    const targets: Target[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));

    // Process top 10 by score
    const topTargets = targets.slice(0, 10);

    console.log(`📥 Loaded ${targets.length} targets. Processing top ${topTargets.length}...\n`);

    const results: GeneratedComment[] = [];

    for (let i = 0; i < topTargets.length; i++) {
        const target = topTargets[i];
        console.log(`[${i + 1}/${topTargets.length}] Generating for: ${target.title.substring(0, 50)}...`);

        const result = await generateCommentForPost(target);
        results.push(result);

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Save outputs
    fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2), 'utf-8');
    fs.writeFileSync(OUTPUT_MD, generateMarkdownOutput(results), 'utf-8');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Comment generation complete!');
    console.log(`📄 JSON: ${OUTPUT_JSON}`);
    console.log(`📝 Markdown: ${OUTPUT_MD}`);
    console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
