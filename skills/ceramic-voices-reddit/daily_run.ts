import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const today = new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });

console.log(`
╔══════════════════════════════════════════════════════════════╗
║         🔥 Ceramic Voices - Daily Reddit Pipeline            ║
║                      ${today}                          ║
╚══════════════════════════════════════════════════════════════╝
`);

console.log('📋 Daily Workflow:');
console.log('   Step 1: Scrape Reddit Intelligence Dashboard (Browser)');
console.log('   Step 2: Filter posts with Ceramic Voices logic');
console.log('   Step 3: Generate Tudou-style comments');
console.log('   Step 4: Output ready-to-use comment drafts');
console.log('\n' + '='.repeat(60) + '\n');

// Step 1: Check if we need fresh data
const dataFile = path.join(__dirname, 'data/reddit_export.json');
const targetsFile = path.join(__dirname, 'data/ceramic_voices_targets.json');

console.log('📊 Step 1: Checking data freshness...');

if (fs.existsSync(dataFile)) {
    const stats = fs.statSync(dataFile);
    const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    console.log(`   Last updated: ${ageHours.toFixed(1)} hours ago`);

    if (ageHours > 24) {
        console.log('   ⚠️  Data is stale (>24h). Please scrape fresh data from:');
        console.log('   🔗 https://wordcrafter.ai/reddit-intelligence-dashboard');
        console.log('\n   Tell Antigravity: "Scrape Reddit Intelligence and update data"\n');
    } else {
        console.log('   ✅ Data is fresh');
    }
} else {
    console.log('   ❌ No data found. Please scrape first.');
    process.exit(1);
}

// Step 2: Run filter
console.log('\n📊 Step 2: Running filter...');
try {
    execSync('npx tsx process_reddit_data.ts', { cwd: __dirname, stdio: 'inherit' });
} catch (error) {
    console.error('❌ Filter failed');
    process.exit(1);
}

// Step 3: Generate comments
console.log('\n📊 Step 3: Generating comments...');
try {
    execSync('npx tsx run_full_pipeline.ts', { cwd: __dirname, stdio: 'inherit' });
} catch (error) {
    console.error('❌ Comment generation failed');
}

// Step 4: Retry any failures
console.log('\n📊 Step 4: Retrying failures...');
try {
    execSync('npx tsx retry_failed.ts', { cwd: __dirname, stdio: 'inherit' });
} catch (error) {
    console.error('❌ Retry failed');
}

// Summary
const outputFile = path.join(__dirname, 'output/full_comments_draft.md');
console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     ✅ DAILY RUN COMPLETE                    ║
╚══════════════════════════════════════════════════════════════╝

📝 Your comment drafts are ready:
   ${outputFile}

🚀 Next Steps:
   1. Open the markdown file above
   2. Review each comment and pick your favorite style
   3. Copy and paste to Reddit

💡 To refresh data tomorrow, tell Antigravity:
   "Scrape Reddit Intelligence and generate new comments"
`);
