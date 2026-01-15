/**
 * WeChat 群聊分析系统 - 运营报告
 * 
 * 功能：
 * 1. 累积历史消息分析
 * 2. 用户画像和性格分析
 * 3. 识别共创者和参与层级
 * 4. 生成激活策略和维护建议
 * 5. 每日活跃度曲线
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 加载环境变量
dotenv.config({ path: path.join(process.cwd(), '../potatoblog/.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found');
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
    content: string;
    senderUsername: string;
    senderDisplayName: string;
}

interface UserProfile {
    username: string;
    displayName: string;
    totalMessages: number;
    activeDays: Set<string>;
    topics: Map<string, number>;      // 话题 -> 参与次数
    interactionPartners: Map<string, number>; // 互动对象 -> 次数
    peakHours: Map<number, number>;   // 活跃时段
    firstSeen: string;
    lastSeen: string;
    sampleMessages: string[];         // 代表性消息样本
}

// ================== 数据加载 ==================

function loadAllMessages(): ChatMessage[] {
    const chatHistoryPath = path.join(process.cwd(), 'chathistory');
    const files = fs.readdirSync(chatHistoryPath).filter(f => f.endsWith('.json'));

    let allMessages: ChatMessage[] = [];
    for (const file of files) {
        const rawData = fs.readFileSync(path.join(chatHistoryPath, file), 'utf-8');
        const data = JSON.parse(rawData);
        const messages = Array.isArray(data) ? data : data.messages || [];
        allMessages = allMessages.concat(messages);
    }

    // 按时间排序
    allMessages.sort((a, b) => a.createTime - b.createTime);

    console.log(`📂 Loaded ${allMessages.length} messages from ${files.length} files`);
    return allMessages;
}

// ================== 用户画像构建 ==================

function buildUserProfiles(messages: ChatMessage[]): Map<string, UserProfile> {
    console.log(`👥 Building user profiles...`);
    const profiles = new Map<string, UserProfile>();

    for (const msg of messages) {
        if (!msg.senderUsername || msg.type === '系统消息') continue;

        const username = msg.senderUsername;

        if (!profiles.has(username)) {
            profiles.set(username, {
                username,
                displayName: msg.senderDisplayName || username,
                totalMessages: 0,
                activeDays: new Set(),
                topics: new Map(),
                interactionPartners: new Map(),
                peakHours: new Map(),
                firstSeen: msg.formattedTime,
                lastSeen: msg.formattedTime,
                sampleMessages: []
            });
        }

        const profile = profiles.get(username)!;
        profile.totalMessages++;
        profile.lastSeen = msg.formattedTime;

        // 记录活跃日期
        const date = msg.formattedTime?.split(' ')[0];
        if (date) profile.activeDays.add(date);

        // 记录活跃时段
        const hour = parseInt(msg.formattedTime?.split(' ')[1]?.split(':')[0] || '0');
        profile.peakHours.set(hour, (profile.peakHours.get(hour) || 0) + 1);

        // 收集消息样本（限制数量）
        if (msg.content && msg.content.length > 20 && profile.sampleMessages.length < 10) {
            profile.sampleMessages.push(msg.content.substring(0, 200));
        }

        // 检测@提及
        const mentions = msg.content?.match(/@[\u4e00-\u9fa5a-zA-Z0-9_]+/g);
        if (mentions) {
            for (const mention of mentions) {
                const partner = mention.substring(1);
                profile.interactionPartners.set(partner, (profile.interactionPartners.get(partner) || 0) + 1);
            }
        }
    }

    console.log(`   ✅ Built profiles for ${profiles.size} users`);
    return profiles;
}

// ================== 用户分层 ==================

function categorizeUsers(profiles: Map<string, UserProfile>): {
    cocreators: string[];
    heavy: string[];
    medium: string[];
    light: string[];
    silent: string[];
    churned: string[];
} {
    console.log(`📊 Categorizing users...`);

    const users = Array.from(profiles.values());
    const avgMessages = users.reduce((sum, u) => sum + u.totalMessages, 0) / users.length;
    const avgDays = users.reduce((sum, u) => sum + u.activeDays.size, 0) / users.length;

    const result = {
        cocreators: [] as string[],
        heavy: [] as string[],
        medium: [] as string[],
        light: [] as string[],
        silent: [] as string[],
        churned: [] as string[]
    };

    // 计算最近活跃天数（用于识别流失用户）
    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const user of users) {
        const lastSeenDate = new Date(user.lastSeen);
        const msgRatio = user.totalMessages / avgMessages;
        const dayRatio = user.activeDays.size / avgDays;

        if (msgRatio >= 3 && dayRatio >= 2) {
            result.cocreators.push(user.displayName);
        } else if (msgRatio >= 1.5 || dayRatio >= 1.5) {
            result.heavy.push(user.displayName);
        } else if (msgRatio >= 0.5 || dayRatio >= 0.5) {
            result.medium.push(user.displayName);
        } else if (user.totalMessages > 2) {
            result.light.push(user.displayName);
        } else {
            result.silent.push(user.displayName);
        }

        // 识别流失用户（曾经活跃，但最近7天没有发言）
        if (user.totalMessages >= 5 && lastSeenDate < sevenDaysAgo) {
            result.churned.push(user.displayName);
        }
    }

    console.log(`   ✅ Cocreators: ${result.cocreators.length}, Heavy: ${result.heavy.length}, Medium: ${result.medium.length}, Light: ${result.light.length}, Silent: ${result.silent.length}`);
    return result;
}

// ================== 活跃度曲线 ==================

function calculateDailyActivity(messages: ChatMessage[]): Map<string, number> {
    const activity = new Map<string, number>();

    for (const msg of messages) {
        const date = msg.formattedTime?.split(' ')[0];
        if (date) {
            activity.set(date, (activity.get(date) || 0) + 1);
        }
    }

    return activity;
}

// ================== AI 分析 ==================

async function generateOpsReport(
    profiles: Map<string, UserProfile>,
    categories: ReturnType<typeof categorizeUsers>,
    dailyActivity: Map<string, number>
): Promise<string> {
    console.log(`🤖 Generating operations report with AI...`);

    // 准备用户画像摘要
    const topUsers = Array.from(profiles.values())
        .sort((a, b) => b.totalMessages - a.totalMessages)
        .slice(0, 30);

    const userSummaries = topUsers.map(u => {
        const partners = Array.from(u.interactionPartners.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);
        const peakHour = Array.from(u.peakHours.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;

        return `- ${u.displayName}: ${u.totalMessages}条消息, 活跃${u.activeDays.size}天, 常互动: ${partners.join('/')}, 活跃时段: ${peakHour}点, 样本: "${u.sampleMessages[0]?.substring(0, 50) || '无'}..."`;
    }).join('\n');

    // 活跃度数据
    const activityData = Array.from(dailyActivity.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => `${date}: ${count}条`)
        .join(', ');

    // 沉默用户样本
    const silentSamples = categories.silent.slice(0, 10).map(name => {
        const profile = Array.from(profiles.values()).find(p => p.displayName === name);
        return profile ? `- ${name}: "${profile.sampleMessages[0]?.substring(0, 80) || '无发言记录'}..."` : '';
    }).filter(Boolean).join('\n');

    const prompt = `
你是一位专业的社群运营分析师，请根据以下数据生成"复利日知录第5季"社群的运营分析报告。

## 用户分层数据
- 共创者（高频活跃，连接多人）: ${categories.cocreators.join(', ')}
- 重度参与者: ${categories.heavy.join(', ')}
- 中度参与者: ${categories.medium.join(', ')}
- 轻度参与者: ${categories.light.slice(0, 20).join(', ')}${categories.light.length > 20 ? '...' : ''}
- 沉默用户: ${categories.silent.slice(0, 20).join(', ')}${categories.silent.length > 20 ? '...' : ''}
- 流失用户（曾活跃，近7天无发言）: ${categories.churned.join(', ') || '暂无'}

## 用户画像摘要
${userSummaries}

## 每日活跃度
${activityData}

## 沉默用户发言样本
${silentSamples}

请生成以下格式的运营报告（Markdown）：

# 📊 复利日知录社群运营分析报告

## 一、整体健康度

### 活跃度趋势
分析每日活跃度变化趋势，识别高峰和低谷

### 参与层级分布
用饼图或列表展示各层级用户占比

### 健康度评分
给出1-100的健康度评分及理由

## 二、用户画像分析

### 共创者特征
分析共创者的共同特点、互动模式、贡献方向

### 用户性格分类
根据发言内容，为关键用户打上性格标签（如：知识分享者/实践派/连接者/旁观者等）

## 三、激活策略

### 沉默用户激活
针对沉默用户，根据他们的历史发言分析：
- 感兴趣的话题是什么？
- 曾在什么情况下互动过？
- 具体的激活方法（复刻当时的场景）

### 流失用户召回
针对流失用户的召回策略

### 轻度用户转化
如何将轻度参与者转化为中度/重度参与者

## 四、话题运营建议

### 受欢迎话题
根据活跃度和互动量，识别最受欢迎的话题类型

### 话题增加建议
哪些话题应该增加频率？

## 五、运营行动清单

给出5-10个具体的、可执行的运营行动建议

---
*生成时间: ${new Date().toISOString().split('T')[0]}*
`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('❌ AI error:', error);
        throw error;
    }
}

// ================== 主函数 ==================

async function main() {
    console.log(`\n🚀 WeChat Operations Report Generator\n`);
    console.log('='.repeat(50));

    // 1. 加载所有消息
    const messages = loadAllMessages();

    // 2. 构建用户画像
    const profiles = buildUserProfiles(messages);

    // 3. 用户分层
    const categories = categorizeUsers(profiles);

    // 4. 计算活跃度
    const dailyActivity = calculateDailyActivity(messages);

    // 5. 生成报告
    const report = await generateOpsReport(profiles, categories, dailyActivity);

    // 6. 保存报告
    const outputDir = path.join(process.cwd(), 'reports');
    fs.mkdirSync(outputDir, { recursive: true });

    const reportPath = path.join(outputDir, 'ops-report.md');
    fs.writeFileSync(reportPath, report);

    console.log(`\n✅ Operations report generated!`);
    console.log(`   📄 ${reportPath}`);
    console.log('\n' + '='.repeat(50) + '\n');
}

main().catch(console.error);
