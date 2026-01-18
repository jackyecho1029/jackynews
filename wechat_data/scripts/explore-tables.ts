import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'EchoTrace', 'wxid_76c1zk9dx9dl12', 'message_0.db');
const CONTACT_DB_PATH = path.join(process.cwd(), 'EchoTrace', 'wxid_76c1zk9dx9dl12', 'contact.db');
const TARGET_GROUP = "50381382798@chatroom";

const db = new Database(DB_PATH, { readonly: true });
const contactDb = new Database(CONTACT_DB_PATH, { readonly: true });

// 加载联系人
const contacts = new Map();
const contactRows = contactDb.prepare('SELECT username, nick_name, remark FROM contact').all() as any[];
for (const contact of contactRows) {
    contacts.set(contact.username, contact);
}
console.log(`Loaded ${contacts.size} contacts\n`);

// 查找包含群组消息的表
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Msg_%'").all() as any[];
console.log(`Checking ${tables.length} message tables for group ${TARGET_GROUP}...\n`);

let foundTable: string | null = null;
let sampleMessage: any = null;

for (const table of tables) {
    try {
        // 尝试查找群组消息
        const stmt = db.prepare(`SELECT * FROM ${table.name} LIMIT 5`);
        const rows = stmt.all() as any[];

        if (rows.length > 0) {
            console.log(`Table: ${table.name}`);
            console.log(`  Columns:`, Object.keys(rows[0]).join(', '));
            console.log(`  Sample row:`, JSON.stringify(rows[0], null, 2).substring(0, 500));
            console.log();

            // 保存第一个有数据的表作为样本
            if (!sampleMessage) {
                sampleMessage = rows[0];
                foundTable = table.name;
            }
        }
    } catch (err) {
        console.log(`  Error in ${table.name}:`, err);
    }
}

console.log(`\nFound table with data: ${foundTable}`);
console.log(`Sample message structure:`, Object.keys(sampleMessage || {}).join(', '));

db.close();
contactDb.close();
