/**
 * 直接从 EchoTrace 数据库查询微信群消息
 * 简化版 - 直接查询最新数据，无需月度导出
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

// 群组 ID
const TARGET_GROUP = "50381382798@chatroom"; // 复利日知录第5季

// 数据库路径
const DB_DIR = path.join(process.cwd(), 'EchoTrace', 'wxid_76c1zk9dx9dl12');

// 用户别名配置路径
const USER_ALIASES_PATH = path.join(process.cwd(), 'config', 'user-aliases.json');

// 检测是否为 wxid 格式（不适合显示）
function isWxidFormat(name: string): boolean {
    if (!name) return true;
    // 匹配 wxid_xxx, Dwxid_xxx, 或纯字母数字长串
    return /^[Dd]?wxid_/i.test(name) || /^[A-Za-z0-9_]{15,}$/.test(name);
}

// 加载用户别名配置
function loadUserAliases(): Map<string, string> {
    const aliases = new Map<string, string>();
    try {
        if (fs.existsSync(USER_ALIASES_PATH)) {
            const data = JSON.parse(fs.readFileSync(USER_ALIASES_PATH, 'utf-8'));
            for (const [key, value] of Object.entries(data)) {
                if (key !== '_comment' && typeof value === 'string') {
                    aliases.set(key, value);
                }
            }
            console.log(`   ✅ Loaded ${aliases.size} user aliases`);
        }
    } catch (err) {
        console.log(`   ⚠️  Failed to load user aliases: ${err}`);
    }
    return aliases;
}

function formatTimestamp(ts: number): string {
    const date = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getMessageType(type: number): string {
    const map: Record<number, string> = {
        1: '文本消息',
        3: '图片消息',
        34: '语音',
        42: '名片',
        43: '视频',
        47: '动画表情',
        48: '位置',
        49: '引用消息',
        10000: '系统消息',
        10002: '撤回消息',
    };
    return map[type] || `未知(${type})`;
}

async function main() {
    const args = process.argv.slice(2);
    let targetDate = args.find(a => a.startsWith('--date='))?.split('=')[1];

    if (!targetDate) {
        const today = new Date();
        targetDate = today.toISOString().split('T')[0];
    }

    console.log(`\n📂 Extracting messages for ${targetDate} from EchoTrace database...\n`);

    // 找到所有 Msg 表
    const contactDbPath = path.join(DB_DIR, 'contact.db');
    const messageDbPath = path.join(DB_DIR, 'message_0.db');

    if (!fs.existsSync(contactDbPath) || !fs.existsSync(messageDbPath)) {
        console.error('❌ Database files not found');
        console.error(`   Contact DB: ${contactDbPath}`);
        console.error(`   Message DB: ${messageDbPath}`);
        process.exit(1);
    }

    // 打开数据库
    const contactDb = new Database(contactDbPath, { readonly: true });
    const messageDb = new Database(messageDbPath, { readonly: true });

    try {
        // 加载联系人
        console.log('📋 Loading contacts...');
        const contacts = new Map();
        const contactRows = contactDb.prepare('SELECT username, nick_name, remark FROM contact').all() as any[];
        for (const contact of contactRows) {
            contacts.set(contact.username, {
                nickname: contact.nick_name,
                remark: contact.remark
            });
        }
        console.log(`   ✅ Loaded ${contacts.size} contacts`);

        // 加载用户别名
        console.log('📋 Loading user aliases...');
        const userAliases = loadUserAliases();

        // 查找群组消息表
        const tablesQuery = messageDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Msg_%'");
        const tables = tablesQuery.all() as any[];
        console.log(`\n📊 Found ${tables.length} message tables`);

        // 查询所有表
        const allMessages: any[] = [];
        for (const table of tables) {
            const tableName = table.name;
            try {
                const stmt = messageDb.prepare(`
          SELECT localId, createTime, type, content, isSend, talker, msgSvrId
          FROM ${tableName}
          WHERE talker = ?
          ORDER BY createTime ASC
        `);
                const messages = stmt.all(TARGET_GROUP) as any[];
                allMessages.push(...messages);
            } catch (err) {
                // 表结构可能不同，跳过
                console.log(`   ⚠️  Skipping ${tableName}: ${err}`);
            }
        }

        console.log(`\n✅ Found total ${allMessages.length} messages in group`);

        // 筛选目标日期
        const startTs = new Date(targetDate).getTime();
        const endTs = startTs + 86400000; // +1 day

        const filteredMessages = allMessages.filter(m =>
            m.createTime >= startTs && m.createTime < endTs
        );

        console.log(`   📅 Filtered to ${filteredMessages.length} messages on ${targetDate}`);

        if (filteredMessages.length === 0) {
            console.log('\n⚠️  No messages found for this date');
            const dates = new Set(allMessages.map(m => formatTimestamp(m.createTime).split(' ')[0]));
            console.log('   Available dates:', Array.from(dates).slice(-20).join(', '));
            process.exit(0);
        }

        // 转换格式
        const formatted = filteredMessages.map(msg => {
            // 提取发送者（群消息格式：senderUsername:\ncontent）
            let senderUsername = '';
            let content = msg.content || '';

            // 尝试从 content 提取发送者
            const match = content.match(/^([^:\n]+):\n/);
            if (match) {
                senderUsername = match[1];
                content = content.replace(/^[^:\n]+:\n/, '');
            }

            const contact = contacts.get(senderUsername);
            // 三层解析：1.联系人备注/昵称 2.用户别名配置 3.过滤wxid格式
            let displayName = contact?.remark || contact?.nickname;
            if (!displayName) {
                displayName = userAliases.get(senderUsername);
            }
            if (!displayName) {
                displayName = isWxidFormat(senderUsername) ? '群成员' : (senderUsername || '群成员');
            }

            return {
                localId: msg.localId,
                createTime: msg.createTime,
                formattedTime: formatTimestamp(msg.createTime),
                type: getMessageType(msg.type),
                localType: msg.type,
                content,
                isSend: msg.isSend,
                senderUsername,
                senderDisplayName: displayName,
                source: msg.talker,
                senderAvatarKey: senderUsername || msg.talker,
            };
        });

        // 包装成和导出JSON相同的格式
        const output = {
            session: {
                wxid: TARGET_GROUP,
                nickname: '复利日知录第 5 季交流群（2026 ）',
                remark: '复利日知录第 5 季交流群（2026 ）',
                displayName: '复利日知录第 5 季交流群（2026 ）',
                type: '群聊',
                lastTimestamp: filteredMessages[filteredMessages.length - 1]?.createTime || 0,
                messageCount: formatted.length
            },
            messages: formatted
        };

        // 保存到 chathistory 目录（临时文件，用于今日分析）
        const outputPath = path.join(
            process.cwd(),
            'chathistory',
            `复利日知录第 5 季交流群（2026 ）_${Date.now()}.json`
        );

        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

        console.log(`\n✅ Extraction complete!`);
        console.log(`   Output: ${outputPath}`);
        console.log(`   Messages: ${formatted.length}`);
        console.log(`   Time range: ${formatted[0]?.formattedTime} - ${formatted[formatted.length - 1]?.formattedTime}\n`);

    } finally {
        contactDb.close();
        messageDb.close();
    }
}

main().catch(console.error);
