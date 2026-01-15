/**
 * WeChat 群聊分析系统 - Journal 索引 (改版)
 * 
 * 功能：
 * 1. 汇总每日报告要点
 * 2. 生成月度索引文件 - 包含一句话目录
 * 3. 记录每日金句与 AI 思考
 * 4. 记录每日行动建议
 * 5. 提供多维报告链接 (Markdown, HTML, PNG)
 */

import * as fs from 'fs';
import * as path from 'path';

interface JournalEntry {
    date: string;
    oneSentenceSummary: string;
    topics: string[];
    goldQuotes: { quote: string; author: string; thinking: string }[];
    actionSuggestion: string;
    keyConnectors: string[];
}

// ================== 解析每日报告 ==================

function parseDailyReport(reportPath: string): JournalEntry | null {
    if (!fs.existsSync(reportPath)) return null;

    const content = fs.readFileSync(reportPath, 'utf-8');
    const dateMatch = reportPath.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : 'unknown';



    // 提取所有话题名称
    const allTopicMatches = content.matchAll(/###\s*\d+\.\s*(.+?)(?=\s*\(约)/g);
    const topics: string[] = [];
    for (const match of allTopicMatches) {
        topics.push(match[1].trim());
    }

    // 提取金句、作者、思考 (基于新格式)
    const goldQuotes: { quote: string; author: string; thinking: string }[] = [];
    const quoteBlocks = content.matchAll(/\[QUOTE\]([\s\S]*?)\[\/QUOTE\]/g);
    for (const block of quoteBlocks) {
        const blockContent = block[1];
        const line1 = blockContent.trim().split('\n')[0];
        const quoteMatch = line1.match(/「(.+?)」\s*——\s*(.+)$/);
        const thinkingMatch = blockContent.match(/\*\*💡 思考:\*\*\s*(.+)$/m);

        if (quoteMatch) {
            goldQuotes.push({
                quote: quoteMatch[1].trim(),
                author: quoteMatch[2].trim(),
                thinking: thinkingMatch ? thinkingMatch[1].trim() : ''
            });
        }
    }

    // 提取一句话摘要：改用第一条金句 (若无金句则回退到话题)
    let oneSentenceSummary = "社群深度探讨与知识分享";
    if (goldQuotes.length > 0) {
        oneSentenceSummary = `${goldQuotes[0].quote} —— ${goldQuotes[0].author}`;
        // 如果太长，截断一下
        if (oneSentenceSummary.length > 50) {
            oneSentenceSummary = oneSentenceSummary.substring(0, 48) + "...";
        }
    } else {
        const topicMatches = content.match(/\[TOPIC\][\s\S]*?###\s*\d+\.\s*(.+?)(?=\n|\[\/TOPIC\])/);
        if (topicMatches && topicMatches[1]) {
            oneSentenceSummary = topicMatches[1].trim();
        }
    }

    // 提取行动建议 (增强 Regex，支持到文件结尾)
    const actionMatch = content.match(/##\s*六、每日行动建议[\s\S]*?$/);
    const actionSuggestion = actionMatch
        ? actionMatch[0].replace(/##\s*六、每日行动建议/, '').trim()
        : '';

    // 提取关键连接者
    const connectorsMatch = content.match(/###\s*🌟\s*关键连接者[\s\S]*?(?=###|##|\[|$)/);
    const keyConnectors: string[] = [];
    if (connectorsMatch) {
        const connectorLines = connectorsMatch[0].match(/\*\*(.+?)\*\*/g);
        if (connectorLines) {
            keyConnectors.push(...connectorLines.map(c => c.replace(/\*\*/g, '').trim()));
        }
    }

    return {
        date,
        oneSentenceSummary,
        topics,
        goldQuotes,
        actionSuggestion,
        keyConnectors: [...new Set(keyConnectors)].slice(0, 3)
    };
}

// ================== 生成月度索引 ==================

function generateMonthlyIndex(entries: JournalEntry[], month: string): string {
    let markdown = `# 📔 复利日知录月度刊物 - ${month}\n\n`;
    markdown += `> 记录学习与成长的点滴，享受复利的力量。本月共收录 ${entries.length} 篇。 🎓\n\n`;

    // 1. 快速索引目录 (一句话目录)
    markdown += `## 📑 快速索引 (一句话目录)\n\n`;
    markdown += `| 日期 | 精华摘要 | 核心人物 |\n`;
    markdown += `| :--- | :--- | :--- |\n`;
    for (const entry of entries) {
        markdown += `| ${entry.date.substring(5)} | [${entry.oneSentenceSummary}](#d-${entry.date}) | ${entry.keyConnectors.join(', ')} |\n`;
    }
    markdown += `\n---\n\n`;

    // 2. 每日详尽内容
    for (const entry of entries) {
        markdown += `## <a name="d-${entry.date}"></a> 📅 ${entry.date}\n\n`;

        markdown += `**核心话题**: ${entry.topics.join(' | ')}\n\n`;

        // 报告链接
        markdown += `🔗 **完整报告**: [网页版](../reports/${entry.date}/daily-report.html) | [分享图](../reports/${entry.date}/daily-report.png) | [原文](../reports/${entry.date}/daily-report.md)\n\n`;

        if (entry.goldQuotes.length > 0) {
            markdown += `### ✨ 今日金句\n\n`;
            for (const item of entry.goldQuotes) {
                markdown += `> 「${item.quote}」 —— **${item.author}**\n`;
                if (item.thinking) {
                    markdown += `> *💡 AI 思考: ${item.thinking}*\n`;
                }
                markdown += `\n`;
            }
        }

        if (entry.actionSuggestion) {
            markdown += `### 🚀 每日行动建议\n\n`;
            markdown += `${entry.actionSuggestion}\n\n`;
        }

        markdown += `\n---\n\n`;
    }

    return markdown;
}

// ================== 主函数 ==================

async function main() {
    console.log(`\n📔 Updating Journal Index (Redesign)\n`);
    console.log('='.repeat(50));

    const reportsDir = path.join(process.cwd(), 'reports');
    const journalDir = path.join(process.cwd(), 'journal');

    if (!fs.existsSync(journalDir)) {
        fs.mkdirSync(journalDir, { recursive: true });
    }

    // 扫描所有日期目录
    const dateDirs = fs.readdirSync(reportsDir)
        .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort();

    console.log(`📂 Found ${dateDirs.length} daily reports`);

    // 按月份分组
    const monthlyEntries = new Map<string, JournalEntry[]>();

    for (const dateDir of dateDirs) {
        const reportPath = path.join(reportsDir, dateDir, 'daily-report.md');
        const entry = parseDailyReport(reportPath);

        if (entry) {
            const month = dateDir.substring(0, 7); // YYYY-MM
            if (!monthlyEntries.has(month)) {
                monthlyEntries.set(month, []);
            }
            monthlyEntries.get(month)!.push(entry);
            console.log(`   ✅ Parsed ${dateDir} - ${entry.oneSentenceSummary}`);
        }
    }

    // 生成月度索引
    for (const [month, entries] of monthlyEntries) {
        const indexContent = generateMonthlyIndex(entries, month);
        const indexPath = path.join(journalDir, `${month}-index.md`);
        fs.writeFileSync(indexPath, indexContent);
        console.log(`   📄 Generated ${month}-index.md`);
    }

    // 更新 README.md 作为总门面
    let masterIndex = `# 📚 复利日知录 - 刊物总索引\n\n`;
    masterIndex += `> 见、感、思、行。记录成长的复利。 📈\n\n`;
    masterIndex += `## 📅 月度精选\n\n`;

    const months = Array.from(monthlyEntries.keys()).sort().reverse();
    for (const month of months) {
        const count = monthlyEntries.get(month)!.length;
        masterIndex += `- **[${month} 精华月刊](${month}-index.md)** - 共 ${count} 篇每日精华\n`;
    }

    fs.writeFileSync(path.join(journalDir, 'README.md'), masterIndex);

    console.log(`\n✅ Journal refactored successfully!`);
    console.log(`   📂 ${journalDir}`);
    console.log('\n' + '='.repeat(50) + '\n');
}

main().catch(console.error);
