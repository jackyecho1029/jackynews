import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// 群组 ID
const TARGET_GROUP = "50381382798@chatroom"; // 复利日知录第5季

// 数据库路径
const DB_DIR = path.join(process.cwd(), 'EchoTrace', 'wxid_76c1zk9dx9dl12');

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
            console.log(`   ✅ Loaded ${aliases.size} user aliases`);
        }
    } catch (err) {
        console.log(`   ⚠️  Failed to load user aliases: ${err}`);
    }
    return aliases;
}

function formatTimestamp(ts: number): string {
    // 某些版本的 create_time 是秒，某些是毫秒
    const date = new Date(ts > 10000000000 ? ts : ts * 1000);
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

    const contactDbPath = path.join(DB_DIR, 'contact.db');
    const messageDbPath = path.join(DB_DIR, 'message_0.db');

    if (!fs.existsSync(contactDbPath) || !fs.existsSync(messageDbPath)) {
        console.error('❌ Database files not found');
        process.exit(1);
    }

    const contactDb = new Database(contactDbPath, { readonly: true });
    const messageDb = new Database(messageDbPath, { readonly: true });

    try {
        // 1. 加载所有联系人，映射 username 到昵称/备注
        console.log('📋 Loading contacts...');
        const contactByUsername = new Map();
        const contactRows = contactDb.prepare('SELECT id, username, nick_name, remark FROM contact').all() as any[];
        for (const contact of contactRows) {
            contactByUsername.set(contact.username, {
                id: contact.id,
                username: contact.username,
                nickname: contact.nick_name || contact.username,
                remark: contact.remark
            });
        }
        console.log(`   ✅ Loaded ${contactByUsername.size} contacts`);

        // 加载用户别名
        const userAliases = loadUserAliases();

        // 2. 计算群 ID 的 MD5 以定位消息表
        const tableSuffix = crypto.createHash('md5').update(TARGET_GROUP).digest('hex');
        const tableName = `Msg_${tableSuffix}`;
        console.log(`\n📊 Target table: ${tableName} (MD5 of ${TARGET_GROUP})`);

        // 检查表是否存在
        const tableCheck = messageDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
        if (!tableCheck) {
            console.error(`❌ Table ${tableName} not found in database.`);
            process.exit(1);
        }

        // 3. 查询目标日期的消息
        const dateObj = new Date(targetDate);
        const startTs = Math.floor(dateObj.getTime() / 1000);
        const endTs = startTs + 86400;

        console.log(`🔍 Querying messages between ${startTs} and ${endTs}...`);

        const stmt = messageDb.prepare(`
            SELECT local_id, create_time, local_type, message_content, real_sender_id, server_id
            FROM ${tableName}
            WHERE create_time >= ? AND create_time < ?
            ORDER BY create_time ASC
        `);

        const messages = stmt.all(startTs, endTs) as any[];
        console.log(`✅ Found ${messages.length} messages on ${targetDate}`);

        if (messages.length === 0) {
            process.exit(0);
        }

        // 4. 转换并格式化
        const formatted = messages.map(msg => {
            // 真正的发送者信息在 message_content 里，格式: "username:\ncontent"
            let senderUsername = '';
            let content = String(msg.message_content || '');

            // 尝试从 content 提取发送者
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

            // 查找联系人信息
            const senderInfo = contactByUsername.get(cleanUsername) || contactByUsername.get(senderUsername);

            let displayName = senderInfo?.remark || senderInfo?.nickname;
            if (!displayName) {
                displayName = userAliases.get(cleanUsername) || userAliases.get(senderUsername);
            }
            if (!displayName) {
                displayName = isWxidFormat(cleanUsername) ? '群成员' : (cleanUsername || '群成员');
            }

            return {
                localId: msg.local_id,
                createTime: msg.create_time * 1000, // 存为毫秒以便 JS 使用
                formattedTime: formatTimestamp(msg.create_time),
                type: getMessageType(msg.local_type),
                localType: msg.local_type,
                content: content,
                isSend: 0,
                senderUsername,
                senderDisplayName: displayName,
                source: TARGET_GROUP,
                senderAvatarKey: senderUsername || 'unknown',
            };
        });

        // 5. 封装并保存
        const output = {
            session: {
                wxid: TARGET_GROUP,
                nickname: '复利日知录第 5 季',
                displayName: '复利日知录第 5 季',
                type: '群聊',
                messageCount: formatted.length
            },
            messages: formatted
        };

        const outDir = path.join(process.cwd(), 'chathistory');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

        const outputPath = path.join(outDir, `复利日知录_${targetDate}_${Date.now()}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

        console.log(`\n✅ Extraction complete!`);
        console.log(`   Output: ${outputPath}`);
        console.log(`   File: ${path.basename(outputPath)}`);

    } finally {
        contactDb.close();
        messageDb.close();
    }
}

main().catch(err => {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
});
