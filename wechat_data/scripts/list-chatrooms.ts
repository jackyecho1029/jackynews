/**
 * 查询数据库中的群组信息
 */

import Database from 'better-sqlite3';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'EchoTrace', 'wxid_76c1zk9dx9dl12', 'contact.db');

const db = new Database(DB_PATH, { readonly: true });

try {
    console.log('\n📋 Listing all chatrooms...\n');

    const rooms = db.prepare(`
    SELECT username, nickname, remark 
    FROM contact 
    WHERE username LIKE '%@chatroom'
    ORDER BY nickname
  `).all();

    for (const room of rooms as any[]) {
        console.log(`ID: ${room.username}`);
        console.log(`Name: ${room.nickname || room.remark || '(unnamed)'}`);
        console.log('---');
    }

    console.log(`\nTotal: ${rooms.length} chatrooms\n`);
} finally {
    db.close();
}
