import fs from 'fs';
import path from 'path';

const FILE = path.resolve(process.cwd(), 'chats.json');

export function loadChats(): number[] {
  try {
    if (!fs.existsSync(FILE)) return [];
    const raw = fs.readFileSync(FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

export function saveChat(id: number) {
  const chats = new Set(loadChats());
  chats.add(id);
  fs.writeFileSync(FILE, JSON.stringify(Array.from(chats), null, 2));
}

export function getChats(): number[] {
  return loadChats();
}
