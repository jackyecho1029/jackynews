import Database from 'better-sqlite3';
import * as path from 'path';

const CONTACT_DB_PATH = path.join(process.cwd(), 'EchoTrace', 'wxid_76c1zk9dx9dl12', 'contact.db');
const contactDb = new Database(CONTACT_DB_PATH, { readonly: true });

// chatroom_member 表只有 room_id 和 member_id
console.log('===CHATROOM_MEMBER TABLE===');
const members = contactDb.prepare(`
  SELECT * FROM chatroom_member 
  WHERE room_id = '50381382798@chatroom'
  LIMIT 10
`).all();

console.log(`Found ${members.length} members in group`);
for (const member of members as any[]) {
    console.log(`  room_id: ${member.room_id}, member_id: ${member.member_id}`);
}

// 检查 chat_room_info_detail 表
console.log('\n\n===CHAT_ROOM_INFO_DETAIL TABLE===');
const detailSchema = contactDb.prepare("PRAGMA table_info(chat_room_info_detail)").all();
console.log('Columns:', (schema as any[]) => c.name).join(', '));

const roomDetails = contactDb.prepare('SELECT * FROM chat_room_info_detail WHERE chatroom_id = ?').all('50381382798@chatroom');
console.log(`\nFound ${roomDetails.length} detail records`);
for (const detail of roomDetails as any[]) {
    console.log(JSON.stringify(detail, null, 2).substring(0, 500));
    console.log('---');
}

contactDb.close();
