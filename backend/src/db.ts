import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'md-reader.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initDb(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      googleId TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chapters (
      id TEXT PRIMARY KEY,
      bookId TEXT NOT NULL,
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'markdown',
      \`order\` INTEGER NOT NULL,
      createdAt INTEGER NOT NULL,
      FOREIGN KEY(bookId) REFERENCES books(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS readings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      bookId TEXT NOT NULL,
      chapterId TEXT NOT NULL,
      scrollPosition INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      UNIQUE(userId, bookId, chapterId),
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(bookId) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY(chapterId) REFERENCES chapters(id) ON DELETE CASCADE
    );
  `);

  const chapterCols = db.pragma('table_info(chapters)') as { name: string }[];
  if (!chapterCols.some(c => c.name === 'type')) {
    db.exec(`ALTER TABLE chapters ADD COLUMN type TEXT NOT NULL DEFAULT 'markdown'`);
  }
}

export default db;
