import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'md-reader.db');

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
}

export default db;
