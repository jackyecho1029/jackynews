/**
 * 查询数据库表结构
 */

import Database from 'better-sqlite3';
import * as path from 'path';

const MESSAGE_DB = path.join(process.cwd(), 'EchoTrace', 'wxid_76c1zk9dx9dl12', 'message_0.db');
const CONTACT_DB = path.join(process.cwd(), 'EchoTrace', 'wxid_76c1zk9dx9dl12', 'contact.db');

console.log('\n📋 Checking database schema...\n');

console.log('=== CONTACT DB ===');
const contactDb = new Database(CONTACT_DB, { readonly: true });
try {
    const tables = contactDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    console.log('Tables:', tables.map(t => t.name).join(', '));

    if (tables.some(t => t.name === 'contact')) {
        const schema = contactDb.prepare("PRAGMA table_info(contact)").all();
        console.log('\nContact table columns:');
        for (const col of schema as any[]) {
            console.log(`  - ${col.name} (${col.type})`);
        }
    }
} finally {
    contactDb.close();
}

console.log('\n=== MESSAGE DB ===');
const messageDb = new Database(MESSAGE_DB, { readonly: true });
try {
    const tables = messageDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    console.log('Tables:', tables.map(t => t.name).join(', '));

    if (tables.some(t => t.name === 'message')) {
        const schema = messageDb.prepare("PRAGMA table_info(message)").all();
        console.log('\nMessage table columns:');
        for (const col of schema as any[]) {
            console.log(`  - ${col.name} (${col.type})`);
        }
    }
} finally {
    messageDb.close();
}

console.log('\n');
