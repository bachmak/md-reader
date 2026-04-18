import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Book } from '../types';

interface ReaderDB extends DBSchema {
  books: {
    key: string;
    value: Book;
    indexes: { 'by-lastOpened': number };
  };
}

let _db: IDBPDatabase<ReaderDB> | null = null;

async function getDb(): Promise<IDBPDatabase<ReaderDB>> {
  if (!_db) {
    _db = await openDB<ReaderDB>('md-reader', 1, {
      upgrade(db) {
        const store = db.createObjectStore('books', { keyPath: 'id' });
        store.createIndex('by-lastOpened', 'lastOpenedAt');
      },
    });
  }
  return _db;
}

export async function saveBook(book: Book): Promise<void> {
  const db = await getDb();
  await db.put('books', book);
}

export async function getAllBooks(): Promise<Book[]> {
  const db = await getDb();
  const books = await db.getAllFromIndex('books', 'by-lastOpened');
  return books.reverse();
}

export async function deleteBook(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('books', id);
}
