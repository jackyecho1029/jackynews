import Database from 'better-sqlite3';
import * as path from 'path';

const DB_PATH = path.join(process.cwd(), 'EchoTrace', 'wxid_76c1zk9dx9dl12', 'message_0.db');
const CONTACT_DB_PATH = path.join(process.cwd(), 'EchoTrace', 'wxid_76c1zk9dx9dl12', 'contact.db');
const GROUP_TABLE = 'Msg_f330f51132799c870641cbaf14f1ac21';

const db = new Database(DB_PATH, { readonly: true });
const contactDb = new Database(CONTACT_DB_PATH, { readonly: true });

// 查找 wxid_btso0q1vek0j22 的联系人信息
const contact = contactDb.prepare('SELECT * FROM contact WHERE username = ?').get('wxid_btso0q1vek0j22');
console.log('Contact info for wxid_btso0q1vek0j22:');
console.log(JSON.stringify(contact, null, 2));

// 查找这个用户的几条消息
const messages = db.prepare(`
  SELECT * FROM ${GROUP_TABLE}
  WHERE message_content LIKE '%wxid_btso0q1vek0j22%'
  LIMIT 3
`).all();

console.log('\n\nSample messages:');
for (const msg of messages as any[]) {
    console.log('\n---');
    console.log('message_content:', msg.message_content);
    console.log('First 200 chars:', msg.message_content?.substring(0, 200));
}

db.close();
contactDb.close();
