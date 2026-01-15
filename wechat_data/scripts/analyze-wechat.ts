/**
 * WeChat 群聊分析系统 - 每日精华报告
 * 
 * 功能：
 * 1. 数据预处理 - 清洗、用户识别、对话脉络
 * 2. 结构洞分析 - 关键连接者、信息流通、成员角色
 * 3. 话题分析 - 提取、动态、关联
 * 4. 生成报告 - HTML 格式，含每日行动建议
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import puppeteer from 'puppeteer';

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '../potatoblog/.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// ================== 类型定义 ==================

interface ChatMessage {
  localId: number;
  createTime: number;
  formattedTime: string;
  type: string;
  localType: number;
  content: string;
  isSend: number | null;
  senderUsername: string;
  senderDisplayName: string;
  source: string;
  senderAvatarKey: string;
  emojiMd5?: string;
}

interface UserStats {
  username: string;
  displayName: string;
  messageCount: number;
  mentionedCount: number;  // 被@次数
  mentionsOthers: number;  // @别人次数
  repliedToCount: number;  // 被回复次数
  replyToOthers: number;   // 回复别人次数
  topics: Set<string>;     // 参与的话题
}

interface AnalysisResult {
  date: string;
  overview: {
    totalMessages: number;
    activeUsers: number;
    timeRange: string;
  };
  structuralHoles: {
    keyConnectors: string[];
    bridgers: string[];
    peripherals: string[];
  };
  topics: {
    name: string;
    keywords: string[];
    participants: string[];
    percentage: number;
  }[];
  goldQuotes: string[];
  dailyAction: string;
}

// ================== 数据加载 ==================

function loadChatHistory(filePath: string): ChatMessage[] {
  console.log(`📂 Loading chat history from: ${filePath}`);
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);

  // 处理可能的包装结构
  if (Array.isArray(data)) {
    return data;
  } else if (data.messages) {
    return data.messages;
  }
  return [];
}

// ================== 数据预处理 ==================

function preprocessMessages(messages: ChatMessage[], targetDate?: string): ChatMessage[] {
  console.log(`🧹 Preprocessing ${messages.length} messages...`);

  let filtered = messages.filter(msg => {
    // 过滤系统消息
    if (msg.type === '系统消息' || msg.type === '撤回消息') return false;
    // 过滤纯表情消息
    if (msg.type === '动画表情' && !msg.content.includes('：')) return false;
    // 过滤空消息
    if (!msg.content || msg.content.trim() === '') return false;
    // 过滤机器人消息
    if (msg.senderDisplayName?.includes('小云雀')) return false;
    return true;
  });

  // 如果指定日期，只保留该日期的消息
  if (targetDate) {
    filtered = filtered.filter(msg => msg.formattedTime.startsWith(targetDate));
  }

  console.log(`   ✅ Kept ${filtered.length} messages after preprocessing`);
  return filtered;
}

// ================== 用户分析 ==================

function analyzeUsers(messages: ChatMessage[]): Map<string, UserStats> {
  console.log(`👥 Analyzing users...`);
  const userMap = new Map<string, UserStats>();

  for (const msg of messages) {
    const username = msg.senderUsername;
    const displayName = msg.senderDisplayName || username;

    if (!userMap.has(username)) {
      userMap.set(username, {
        username,
        displayName,
        messageCount: 0,
        mentionedCount: 0,
        mentionsOthers: 0,
        repliedToCount: 0,
        replyToOthers: 0,
        topics: new Set()
      });
    }

    const user = userMap.get(username)!;
    user.messageCount++;

    // 检测@提及
    const mentions = msg.content.match(/@[\u4e00-\u9fa5a-zA-Z0-9_]+/g);
    if (mentions) {
      user.mentionsOthers += mentions.length;
      // 更新被@者的统计
      for (const mention of mentions) {
        const mentionedName = mention.substring(1);
        for (const [_, otherUser] of userMap) {
          if (otherUser.displayName.includes(mentionedName)) {
            otherUser.mentionedCount++;
          }
        }
      }
    }

    // 检测引用回复
    if (msg.type === '引用消息') {
      user.replyToOthers++;
    }
  }

  console.log(`   ✅ Found ${userMap.size} unique users`);
  return userMap;
}

// ================== Gemini AI 分析 ==================

async function analyzeWithGemini(messages: ChatMessage[], userStats: Map<string, UserStats>, targetDate: string): Promise<string> {
  console.log(`🤖 Analyzing with Gemini AI...`);

  // 准备消息摘要（限制长度避免超出上下文）
  const messageSummary = messages
    .slice(0, 200) // 最多取200条
    .map(m => `[${m.formattedTime.split(' ')[1]}] ${m.senderDisplayName}: ${m.content.substring(0, 100)}`)
    .join('\n');

  // 准备用户统计
  const topUsers = Array.from(userStats.values())
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 20)
    .map(u => `${u.displayName}: ${u.messageCount}条消息, 被@${u.mentionedCount}次`)
    .join('\n');

  const prompt = `
你是一位专业的社群分析师，请分析以下微信群"复利日知录第5季"${targetDate}的聊天记录。

## 聊天记录摘要
${messageSummary}

## 活跃用户统计
${topUsers}

请按以下结构生成分析报告（使用Markdown格式）：

# 📅 复利日知录精华报告 - ${targetDate}

## 一、群聊概况

[STATS]
消息总量: XX条
活跃人数: XX人
话题数量: X个
要点数量: X个
[/STATS]

- **分析时段:** 具体时间范围
- **整体活跃度:** 活跃度评价

## 二、社交结构洞察

### 🌟 关键连接者
识别那些被频繁@、发起热门话题、连接不同对话的核心成员（用简洁的一句话描述每人的角色）

### 🌉 话题桥接者
识别在不同话题间起到衔接作用的成员

### 📊 信息流通模式
- 是否存在明显的对话圈子？
- 哪些成员处于信息边缘？

## 三、话题地图

为每个话题使用以下格式（生成2-4个话题）：

[TOPIC]
### 1. 话题标题 (约XX%占比)

- **关键词:** 关键词1, 关键词2, 关键词3
- **主导者:** 成员1, 成员2
- **演变:** 用2-3句话描述话题如何展开、演变的过程
- **精选对话:**

> **成员名:** "对话内容引用..."

> **另一成员:** "回应内容..."

[/TOPIC]

## 四、知识扩展亮点

群成员对原有内容做了哪些扩展：
- **深化理解:** 描述
- **个性化解读:** 描述  
- **生活场景关联:** 描述

## 五、今日金句

为每条金句使用以下格式（生成3-5条）：

[QUOTE]
「金句内容放在这里，要完整和精炼」 —— 发言者姓名

**💡 思考:** 这句话值得记住是因为...用2-3句话解释这句金句的价值、如何理解、如何应用到自己的生活中。
[/QUOTE]

## 六、每日行动建议

基于今天的讨论，给出一个具体的、可立即执行的小行动建议。
要求：
- 具体到可以在5分钟内开始
- 与今日话题相关
- 能让人感受到复利效应的开始

---
*由 AI 自动生成，仅供参考*
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    throw error;
  }
}

// ================== 报告生成 ==================

function generateHtmlReport(markdownContent: string, date: string): string {
  // 处理特殊格式标签
  let html = markdownContent;

  // 处理 [STATS]...[/STATS] 块 - 转换为统计卡片
  html = html.replace(/\[STATS\]([\s\S]*?)\[\/STATS\]/g, (match, content) => {
    const lines = content.trim().split('\n').filter((l: string) => l.trim());
    const stats = lines.map((line: string) => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const label = parts[0].trim();
        const value = parts.slice(1).join(':').trim().replace(/[条人个]/g, '');
        return `<div class="stat-item"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`;
      }
      return '';
    }).join('');
    return `<div class="stats-grid">${stats}</div>`;
  });

  // 处理 [TOPIC]...[/TOPIC] 块 - 转换为话题卡片
  html = html.replace(/\[TOPIC\]([\s\S]*?)\[\/TOPIC\]/g, (match, content) => {
    return `<div class="topic-card">${content}</div>`;
  });

  // 处理 [QUOTE]...[/QUOTE] 块 - 转换为金句卡片
  html = html.replace(/\[QUOTE\]([\s\S]*?)\[\/QUOTE\]/g, (match, content) => {
    // 解析金句和作者
    const quoteMatch = content.match(/[「"'](.+?)[」"']\s*[—-]+\s*(.+?)(?:\n|$)/);
    const thinkMatch = content.match(/\*\*💡\s*思考[：:]\*\*\s*([\s\S]*?)$/);

    if (quoteMatch) {
      const quoteText = quoteMatch[1].trim();
      const author = quoteMatch[2].trim();
      const thinking = thinkMatch ? thinkMatch[1].trim() : '';

      return `<div class="quote-card">
        <div class="quote-text">「${quoteText}」</div>
        <div class="quote-author">—— ${author}</div>
        ${thinking ? `<div class="quote-thinking">${thinking}</div>` : ''}
      </div>`;
    }
    return `<div class="quote-card">${content}</div>`;
  });

  // 处理 > 引用块
  html = html.replace(/^>\s*\*\*(.+?):\*\*\s*["]?(.+?)["]?\s*$/gm,
    '<div class="dialog-quote"><span class="dialog-author">$1:</span> "$2"</div>');
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote>$1</blockquote>');

  // 基础 Markdown 转 HTML
  html = html
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\.\s+(.*$)/gim, '<li class="numbered">$1</li>')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>复利日知录精华报告 - ${date}</title>
  <style>
    :root {
      --bg-dark: #0f1419;
      --bg-card: #1a1f2e;
      --bg-section: rgba(45, 55, 72, 0.5);
      --bg-topic: rgba(30, 40, 55, 0.8);
      --accent: #4fd1c5;
      --accent-soft: #38b2ac;
      --accent-pink: #f472b6;
      --text-primary: #e2e8f0;
      --text-secondary: #a0aec0;
      --text-muted: #718096;
      --border: rgba(255,255,255,0.06);
      --quote-gold: #fbbf24;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif;
      background: var(--bg-dark);
      min-height: 100vh;
      padding: 16px;
      line-height: 1.75;
      color: var(--text-primary);
      font-size: 15px;
    }
    .container {
      max-width: 640px;
      margin: 0 auto;
      background: var(--bg-card);
      border-radius: 12px;
      padding: 24px;
    }
    
    /* 标题 */
    h1 {
      color: var(--accent);
      font-size: 1.3em;
      margin-bottom: 20px;
      text-align: center;
      font-weight: 600;
    }
    h2 {
      color: var(--text-primary);
      font-size: 1.05em;
      font-weight: 600;
      margin: 24px 0 14px;
      padding: 10px 14px;
      background: var(--bg-section);
      border-radius: 6px;
      border-left: 3px solid var(--accent);
    }
    h3 {
      color: var(--accent-pink);
      font-size: 0.95em;
      font-weight: 500;
      margin: 18px 0 10px;
      padding-left: 10px;
      border-left: 2px solid var(--accent-pink);
    }
    
    /* 统计卡片网格 */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 16px 0 20px;
    }
    .stat-item {
      background: rgba(79, 209, 197, 0.08);
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      border: 1px solid var(--border);
    }
    .stat-value {
      font-size: 2em;
      font-weight: 700;
      color: #a78bfa;
    }
    .stat-label {
      font-size: 0.75em;
      color: var(--text-muted);
      margin-top: 4px;
    }
    
    /* 话题卡片 */
    .topic-card {
      background: var(--bg-topic);
      border-radius: 10px;
      padding: 18px;
      margin: 16px 0;
      border: 1px solid var(--border);
    }
    .topic-card h3 {
      color: var(--accent-pink);
      margin: 0 0 12px 0;
      padding: 0;
      border: none;
      font-size: 1em;
    }
    .topic-card li {
      margin: 6px 0;
      font-size: 0.9em;
    }
    
    /* 对话引用 */
    .dialog-quote {
      background: rgba(255,255,255,0.04);
      border-left: 2px solid var(--accent);
      padding: 10px 14px;
      margin: 10px 0;
      border-radius: 0 6px 6px 0;
      font-size: 0.88em;
      color: var(--text-secondary);
    }
    .dialog-author {
      color: var(--accent);
      font-weight: 500;
    }
    
    /* 金句卡片 */
    .quote-card {
      background: rgba(251, 191, 36, 0.06);
      border-radius: 10px;
      padding: 18px;
      margin: 16px 0;
      border: 1px solid rgba(251, 191, 36, 0.15);
    }
    .quote-text {
      color: var(--quote-gold);
      font-size: 1.05em;
      font-weight: 500;
      line-height: 1.6;
      margin-bottom: 8px;
    }
    .quote-author {
      color: var(--accent-pink);
      font-size: 0.85em;
      text-align: right;
      margin-bottom: 12px;
    }
    .quote-thinking {
      background: rgba(0,0,0,0.2);
      border-radius: 6px;
      padding: 12px;
      font-size: 0.85em;
      color: var(--text-muted);
      line-height: 1.6;
    }
    
    /* 列表 */
    li {
      margin: 8px 0;
      padding-left: 16px;
      list-style: none;
      position: relative;
      color: var(--text-secondary);
      font-size: 0.92em;
    }
    li::before {
      content: "•";
      color: var(--accent);
      position: absolute;
      left: 0;
    }
    li.numbered::before { content: ""; }
    
    strong { color: var(--accent); font-weight: 500; }
    em { color: var(--text-muted); font-style: normal; }
    blockquote {
      background: rgba(255,255,255,0.03);
      border-left: 2px solid var(--accent);
      padding: 8px 12px;
      margin: 8px 0;
      border-radius: 0 6px 6px 0;
      font-size: 0.88em;
      color: var(--text-secondary);
    }
    
    .footer {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.7em;
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
    }
    
    /* 清理多余换行 */
    br + br { display: none; }
    h2 + br, h3 + br, li + br { display: none; }
    .topic-card br + br { display: none; }
    .quote-card br { display: none; }
    .stats-grid + br { display: none; }
  </style>
</head>
<body>
  <div class="container">
    ${html}
    <div class="footer">
      由 AI 自动生成 · 复利日知录社群
    </div>
  </div>
</body>
</html>`;
}



/**
 * 使用 Puppeteer 将 HTML 报告转换为长图
 */
async function generateImageReport(htmlPath: string, outputPath: string) {
  console.log(`📸 Generating PNG report: ${outputPath}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    // 设置视口宽度，高度随意（后面会用 fullPage 截图）
    await page.setViewport({ width: 680, height: 1000 });

    // 加载 HTML 文件
    const absoluteHtmlPath = path.resolve(htmlPath);
    await page.goto(`file://${absoluteHtmlPath}`, { waitUntil: 'networkidle0' });

    // 隐藏一些不需要截图的元素（可选，当前设计中基本都全屏显示）

    // 截取全屏长图
    await page.screenshot({
      path: outputPath,
      fullPage: true
    });

    console.log(`   ✅ PNG report generated!`);
  } catch (error) {
    console.error('❌ Error generating image report:', error);
  } finally {
    await browser.close();
  }
}

// ================== 主函数 ==================

async function main() {
  const args = process.argv.slice(2);
  let targetDate = args.find(a => a.startsWith('--date='))?.split('=')[1];

  // 默认使用今天的日期
  if (!targetDate) {
    const today = new Date();
    targetDate = today.toISOString().split('T')[0];
  }

  console.log(`\n🚀 WeChat Group Analysis - ${targetDate}\n`);
  console.log('='.repeat(50));

  // 1. 加载数据
  const chatHistoryPath = path.join(process.cwd(), 'chathistory');
  const files = fs.readdirSync(chatHistoryPath).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.error('❌ No JSON files found in chathistory folder');
    process.exit(1);
  }

  const messages = loadChatHistory(path.join(chatHistoryPath, files[0]));

  // 2. 预处理
  const processedMessages = preprocessMessages(messages, targetDate);

  if (processedMessages.length === 0) {
    console.log(`⚠️ No messages found for date: ${targetDate}`);
    console.log('   Available dates in the data:');
    const dates = new Set(messages.map(m => m.formattedTime?.split(' ')[0]).filter(Boolean));
    console.log('   ' + Array.from(dates).slice(0, 10).join(', '));
    process.exit(0);
  }

  // 3. 用户分析
  const userStats = analyzeUsers(processedMessages);

  // 4. AI 分析
  const report = await analyzeWithGemini(processedMessages, userStats, targetDate);

  // 5. 生成 HTML 报告
  const htmlReport = generateHtmlReport(report, targetDate);

  // 6. 保存报告
  const outputDir = path.join(process.cwd(), 'reports', targetDate);
  fs.mkdirSync(outputDir, { recursive: true });

  const mdPath = path.join(outputDir, 'daily-report.md');
  const htmlPath = path.join(outputDir, 'daily-report.html');
  const pngPath = path.join(outputDir, 'daily-report.png');

  fs.writeFileSync(mdPath, report);
  fs.writeFileSync(htmlPath, htmlReport);

  // 7. 导出图片
  await generateImageReport(htmlPath, pngPath);

  console.log(`\n✅ Reports generated successfully!`);
  console.log(`   📄 Markdown: ${mdPath}`);
  console.log(`   🌐 HTML: ${htmlPath}`);
  console.log(`   🖼️ PNG: ${pngPath}`);
  console.log('\n' + '='.repeat(50) + '\n');
}

main().catch(console.error);
