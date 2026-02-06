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
import { generateTemplate, ReportData } from './html-template.js';

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '../potatoblog/.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env.local');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

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
    if (msg.type === '动画表情' && (typeof msg.content !== 'string' || !msg.content.includes('：'))) return false;
    // 过滤空消息
    if (!msg.content || typeof msg.content !== 'string' || msg.content.trim() === '') return false;
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

## 五、群内金句精选

请务必提取 3-5 条金句，为每条金句使用以下格式：

[QUOTE]
「金句内容放在这里，要完整和精炼」 —— 发言者姓名

**💡 思考:** 这句话值得记住是因为...总结其核心价值或应用场景。
[/QUOTE]

## 六、每日行动建议

**必须按照以下格式输出：**

【一句话行动主题】

1. **第一个最小阻力行动**（不超过10个字）
2. **第二个最小阻力行动**（不超过10个字）
3. **第三个最小阻力行动**（不超过10个字）

**要求：**
- 行动主题用【】包裹，简洁有力（例如：【5分钟追根溯源行动】）
- 必须列出3个具体步骤，每个步骤以数字开头
- 每个步骤用 **粗体** 包裹
- 步骤要具体到可以在5分钟内开始执行
- 与今日话题紧密相关
- 阻力最小，容易上手


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
  // 解析 [STATS]
  let statsHtml = '';
  const statsMatch = markdownContent.match(/\[STATS\]([\s\S]*?)\[\/STATS\]/);
  if (statsMatch) {
    const lines = statsMatch[1].trim().split('\n').filter(l => l.trim());
    statsHtml = lines.map(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const label = parts[0].trim();
        let value = parts.slice(1).join(':').trim();
        // Clean up value: remove units and extra text
        value = value
          .replace(/[条人个]/g, '')
          .replace(/主要主体.*$/g, '') // Remove "主要主体（含...）" etc
          .replace(/\(.*?\)/g, '') // Remove parentheses content
          .replace(/（.*?）/g, '') // Remove Chinese parentheses content
          .trim();
        return `<div class="stat-card"><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`;
      }
      return '';
    }).join('');
  }

  // 解析社交结构 (## 一)
  const overviewMatch = markdownContent.match(/## 一、群聊概况([\s\S]*?)(?=## 二、社交结构洞察)/);
  const overviewRaw = overviewMatch ? overviewMatch[1].trim() : '';

  // 解析社交结构/总结 (## 二)
  const summaryMatch = markdownContent.match(/## 二、社交结构洞察([\s\S]*?)(?=## 三、话题地图)/);
  const summaryRaw = summaryMatch ? summaryMatch[1].trim() : '';

  // 合并概况和社交结构，生成总结HTML
  const combinedSummary = (overviewRaw + '\n\n' + summaryRaw).trim();
  const summaryHtml = combinedSummary
    .replace(/\[STATS\]([\s\S]*?)\[\/STATS\]/g, '') // 移除stats标记
    .replace(/^### (.*$)/gim, '<strong>$1</strong><br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.*$)/gim, '• $1<br>')
    .replace(/\n\n/g, '<br>')
    .replace(/\n/g, ' ');

  // 解析 [TOPIC] - 添加颜色交替逻辑
  let topicsHtml = '';
  const topicRegex = /\[TOPIC\]([\s\S]*?)\[\/TOPIC\]/g;
  const topicColors = [
    { bg: 'bg-[#f0fdf4]', border: 'border-green-100', label: 'text-green-600', desc: 'text-green-700/60' },
    { bg: 'bg-[#f0f9ff]', border: 'border-blue-100', label: 'text-blue-600', desc: 'text-blue-700/60' },
    { bg: 'bg-[#fef3f2]', border: 'border-orange-100', label: 'text-orange-600', desc: 'text-orange-700/60' },
  ];
  let topicIndex = 0;
  let tMatch;

  while ((tMatch = topicRegex.exec(markdownContent)) !== null) {
    const content = tMatch[1].trim();
    const titleMatch = content.match(/### (\d+\.\s+)?(.+?) \(约(\d+%)占比\)/);
    const keywordsMatch = content.match(/- \*\*关键词:\*\* (.+)/);
    const evolutionMatch = content.match(/- \*\*演变:\*\* ([\s\S]+?)(?=- \*\*精选对话|$)/);

    if (titleMatch) {
      const color = topicColors[topicIndex % topicColors.length];
      const topicNum = String(topicIndex + 1).padStart(2, '0');
      // Use evolution text, but limit to reasonable length (50 chars)
      let description = evolutionMatch ? evolutionMatch[1].trim() : '';
      // If too long, try to truncate at sentence end
      if (description.length > 50) {
        const firstSentence = description.match(/^.{1,50}[。，,\.!！]+/);
        description = firstSentence ? firstSentence[0] : description.substring(0, 50) + '...';
      }
      topicsHtml += `
        <div class="${color.bg} p-4 rounded-3xl border ${color.border}">
            <div class="text-[10px] font-bold ${color.label} uppercase mb-1">Topic ${topicNum} / ${titleMatch[3]}</div>
            <h3 class="font-bold text-slate-800 text-sm mb-2">${titleMatch[2]}</h3>
            <p class="${color.desc} text-[11px]">${description}</p>
        </div>`;
      topicIndex++;
    }
  }

  // 解析知识扩展 (## 四) - 添加颜色点交替
  const highlightsMatch = markdownContent.match(/## 四、知识扩展亮点([\s\S]*?)(?=## 五、群内金句精选)/);
  let highlightsHtml = '';
  if (highlightsMatch) {
    const highlightLines = highlightsMatch[1].trim().split('\n').filter(l => l.trim().startsWith('-'));
    const dotColors = ['bg-green-400', 'bg-blue-400', 'bg-orange-400'];
    highlightsHtml = highlightLines.map((line, idx) => {
      // Extract the full text after the bullet point
      let text = line.substring(2).trim(); // Remove "- "
      // Remove markdown bold markers
      text = text.replace(/\*\*/g, '');
      // Remove the category label and colon if present (e.g., "深化理解: " or "深化理解：")
      text = text.replace(/^[^：:]+[：:]\s*/, '');
      const dotColor = dotColors[idx % dotColors.length];
      return `<div class="highlight-item">
                <div class="w-2 h-2 rounded-full ${dotColor}"></div>
                <span class="text-sm font-bold text-slate-700">${text}</span>
              </div>`;
    }).join('');
  }

  // 解析 [QUOTE]
  const quotes: Array<{ text: string, author: string, tag: string, think?: string }> = [];
  const quoteRegex = /\[QUOTE\]([\s\S]*?)\[\/QUOTE\]/g;
  let qMatch;

  while ((qMatch = quoteRegex.exec(markdownContent)) !== null) {
    const content = qMatch[1].trim();
    const qTextMatch = content.match(/[「"'](.+?)[」"']\s*[—-]+\s*(.+?)(?:\n|$)/);
    const thinkMatch = content.match(/\*\*💡\s*思考[：:]\*\*\s*([\s\S]*?)$/);

    if (qTextMatch) {
      quotes.push({
        text: qTextMatch[1],
        author: qTextMatch[2],
        tag: '价值内化者',
        think: thinkMatch ? thinkMatch[1].trim() : undefined
      });
    }
  }

  // 如果少于3条金句，添加一个合成的"社群共识总结"
  if (quotes.length > 0 && quotes.length < 3) {
    quotes.push({
      text: '学习思维模型，不是为了记住名字，而是为了看清因果。',
      author: '社群共识总结',
      tag: '集体智慧',
    });
  }

  // 生成金句HTML
  let quotesHtml = quotes.map((quote, idx) => {
    const isConsensus = quote.author === '社群共识总结';
    const style = isConsensus ? 'border-left-color: #64748b; opacity: 0.8;' : '';
    const textColor = isConsensus ? 'style="color: #64748b; font-style: italic;"' : '';
    const authorColor = isConsensus ? 'text-slate-500' : 'text-slate-900';

    return `
      <div class="quote-card" ${style ? `style="${style}"` : ''}>
          <p class="quote-text" ${textColor}>「${quote.text}」</p>
          <div class="quote-author">
              <span class="font-black ${authorColor}">— ${quote.author}</span>
              <span class="text-[10px] bg-white px-2 py-0.5 rounded-full border">${quote.tag}</span>
          </div>
          ${quote.think ? `<div class="mt-4 p-4 bg-white/50 rounded-2xl text-[12px] text-slate-500 leading-relaxed italic">💡 AI 思考: ${quote.think}</div>` : ''}
      </div>`;
  }).join('');

  // 解析行动建议 (## 六)
  const actionMatch = markdownContent.match(/## 六、每日行动建议([\s\S]*?)(?=---|$)/);
  let actionTitle = '保持复利思维，持续进化';
  let actionSteps = '';

  if (actionMatch) {
    let actionContent = actionMatch[1].trim();

    // Filter out common prompt phrases that shouldn't appear in output
    actionContent = actionContent
      .replace(/^基于今天的讨论[，,].*?$/m, '')
      .replace(/.*?可立即执行的小行动建议.*?$/m, '')
      .replace(/^给出一个具体的.*?$/m, '')
      .trim();

    // 尝试提取标题和步骤
    const lines = actionContent.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      // First non-empty line is the title, remove 【】 brackets if present
      actionTitle = lines[0].replace(/\*\*/g, '').replace(/^【/, '').replace(/】$/, '').trim();

      // 查找是否有步骤列表（格式：1. **步骤名** 或 **1. 步骤名** 或简单的数字列表）
      const stepPattern = /(?:^|\n)\s*(?:\*\*)?(\d+)\.\s*(?:\*\*)?(.+?)(?:\*\*)?(?=\n|$)/g;
      const stepMatches = [...actionContent.matchAll(stepPattern)];

      if (stepMatches && stepMatches.length >= 3) {
        const stepColors = ['text-green-400', 'text-blue-400', 'text-orange-400'];
        actionSteps = `<div class="grid grid-cols-3 gap-4 mb-6">
          ${stepMatches.slice(0, 3).map((match, idx) => {
          const stepText = match[2].replace(/\*\*/g, '').trim();
          return `<div>
              <div class="${stepColors[idx]} font-black mb-1">Step ${idx + 1}</div>
              <div class="text-[13px] text-white/70">${stepText}</div>
            </div>`;
        }).join('')}
        </div>`;
      }
    }
  }

  // Use the new template system
  const reportData: ReportData = {
    date,
    stats: statsHtml,
    summary: summaryHtml,
    topics: topicsHtml,
    highlights: highlightsHtml,
    quotes: quotesHtml,
    actionTitle,
    actionSteps
  };

  return generateTemplate(reportData);
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
    // deviceScaleFactor: 3 提升清晰度到 3x (Retina 级别)
    await page.setViewport({ width: 680, height: 1000, deviceScaleFactor: 3 });

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

  // 优先查找文件名中包含目标日期的文件（适配 _fresh_DATE.json）
  let targetFile = files.find(f => f.includes(targetDate));

  // 如果没找到特定日期的文件，则使用最新的文件（假设是月度导出）
  if (!targetFile) {
    // 按修改时间倒序排序
    targetFile = files
      .map(f => ({ name: f, time: fs.statSync(path.join(chatHistoryPath, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time)[0].name;
    console.log(`⚠️ No specific file for ${targetDate} found, using latest file: ${targetFile}`);
  } else {
    console.log(`✅ Found specific data file: ${targetFile}`);
  }

  const messages = loadChatHistory(path.join(chatHistoryPath, targetFile));

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
