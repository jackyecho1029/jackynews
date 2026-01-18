import Database from 'better-sqlite3';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'EchoTrace', 'wxid_76c1zk9dx9dl12', 'message_0.db');
const db = new Database(DB_PATH, { readonly: true });

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'Msg_%'").all() as any[];
console.log(`Found ${tables.length} message tables:\n`);

for (const table of tables) {
    console.log(`Table: ${table.name}`);
    const schema = db.prepare(`PRAGMA table_info(${table.name})`).all();
    console.log('Columns:', (schema as any[]).map((c: any) => c.name).join(', '));
    console.log();
}

db.close();
