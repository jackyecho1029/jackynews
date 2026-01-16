/**
 * 从群组消息表直接提取 2026-01-16 数据
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'EchoTrace', 'wxid_76c1zk9dx9dl12', 'message_0.db');
const CONTACT_DB_PATH = path.join(process.cwd(), 'EchoTrace', 'wxid_76c1zk9dx9dl12', 'contact.db');

// 群组消息表（从之前的月度导出推断）
const GROUP_TABLE = 'Msg_f330f51132799c870641cbaf14f1ac21';

const targetDate = process.argv[2] || '2026-01-16';

// 用户别名配置路径
const USER_ALIASES_PATH = path.join(process.cwd(), 'config', 'user-aliases.json');

// 检测是否为 wxid 格式（不适合显示）
function isWxidFormat(name: string): boolean {
    if (!name) return true;
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
        }
    } catch (err) {
        // 忽略加载错误
    }
    return aliases;
}

const db = new Database(DB_PATH, { readonly: true });
const contactDb = new Database(CONTACT_DB_PATH, { readonly: true });

// 加载联系人
const contacts = new Map();
const contactRows = contactDb.prepare('SELECT username, nick_name, remark FROM contact').all() as any[];
for (const contact of contactRows) {
    contacts.set(contact.username, contact);
}

// 加载用户别名
const userAliases = loadUserAliases();

console.log(`\n📂 Extracting messages from group table for ${targetDate}...\n`);

// 目标日期的时间戳范围
const startTs = new Date(targetDate).getTime() / 1000; // 转为秒
const endTs = startTs + 86400; // +1天

// 查询消息
const stmt = db.prepare(`
  SELECT * FROM ${GROUP_TABLE}
  WHERE create_time >= ? AND create_time < ?
  ORDER BY create_time ASC
`);

const rows = stmt.all(startTs, endTs) as any[];

console.log(`✅ Found ${rows.length} messages for ${targetDate}\n`);

if (rows.length > 0) {
    console.log('Sample message:');
    console.log(JSON.stringify(rows[0], null, 2));
    console.log(`\nTime range: ${new Date(rows[0].create_time * 1000).toISOString()} - ${new Date(rows[rows.length - 1].create_time * 1000).toISOString()}`);

    // 转换为标准格式
    const formatted = rows.map((msg: any) => {
        // 解析 message_content 获取发送者和内容
        let content = String(msg.message_content || '');
        let senderUsername = '';

        // 群消息格式: senderUsername:\ncontent
        const match = content.match(/^([^:\n]+):\n/);
        if (match) {
            senderUsername = match[1];
            content = content.replace(/^[^:\n]+:\n/, '');
        }

        // 清理 senderUsername：提取纯净的用户名（处理二进制前缀）
        let cleanUsername = senderUsername;
        // 1. 先尝试匹配 wxid 格式
        const wxidMatch = senderUsername.match(/([Dd]?wxid_[a-zA-Z0-9]+)/);
        if (wxidMatch) {
            cleanUsername = wxidMatch[1];
        } else {
            // 2. 提取最后一段有效的用户名（字母数字下划线组成，至少4个字符）
            const usernameMatch = senderUsername.match(/([a-zA-Z][a-zA-Z0-9_]{3,})$/);
            if (usernameMatch) {
                cleanUsername = usernameMatch[1];
            }
        }

        // 三层解析：1.联系人备注/昵称 2.用户别名配置 3.过滤wxid格式
        const contact = contacts.get(cleanUsername) || contacts.get(senderUsername);
        let displayName = contact?.remark || contact?.nick_name;
        if (!displayName) {
            // 用别名查找（同时尝试原始和清理后的 username）
            displayName = userAliases.get(cleanUsername) || userAliases.get(senderUsername);
        }
        if (!displayName) {
            displayName = isWxidFormat(cleanUsername) ? '群成员' : (cleanUsername || '群成员');
        }

        const typeMap: Record<number, string> = {
            1: '文本消息',
            3: '图片消息',
            34: '语音',
            47: '动画表情',
            49: '引用消息',
            10000: '系统消息',
            10002: '撤回消息',
        };

        const formatTime = (ts: number) => {
            const d = new Date(ts * 1000);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
        };

        return {
            localId: msg.local_id,
            createTime: msg.create_time * 1000, // 转为毫秒
            formattedTime: formatTime(msg.create_time),
            type: typeMap[msg.local_type] || `未知(${msg.local_type})`,
            localType: msg.local_type,
            content,
            isSend: msg.origin_source === 1 ? 1 : 0,
            senderUsername,
            senderDisplayName: displayName,
            source: String(msg.source || ''),
            senderAvatarKey: senderUsername,
        };
    });

    // 包装成标准格式
    const output = {
        session: {
            wxid: "50381382798@chatroom",
            nickname: "复利日知录第 5 季交流群（2026 ）",
            remark: "复利日知录第 5 季交流群（2026 ）",
            displayName: "复利日知录第 5 季交流群（2026 ）",
            type: "群聊",
            lastTimestamp: formatted[formatted.length - 1]?.createTime || 0,
            messageCount: formatted.length
        },
        messages: formatted
    };

    // 保存
    const outputPath = path.join(
        process.cwd(),
        'chathistory',
        `复利日知录第 5 季交流群（2026 ）_fresh_${targetDate}.json`
    );

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`\n✅ Saved to: ${outputPath}`);
    console.log(`📊 Total messages: ${formatted.length}`);
}

db.close();
contactDb.close();
