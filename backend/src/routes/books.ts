import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { User, Book, Chapter, ChapterType } from '../types.js';

const MARKDOWN_EXTS = new Set(['.md', '.markdown', '.txt']);
const HTML_EXTS = new Set(['.html', '.htm']);

function chapterTypeFromExt(filename: string): ChapterType | null {
  const ext = path.extname(filename).toLowerCase();
  if (HTML_EXTS.has(ext)) return 'html';
  if (MARKDOWN_EXTS.has(ext)) return 'markdown';
  return null;
}

const router = Router();

const uploadDir = path.join(process.cwd(), 'data', 'uploads');
const upload = multer({
  dest: uploadDir,
  fileFilter: (req, file, cb) => {
    if (chapterTypeFromExt(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only markdown or HTML files allowed'));
    }
  },
});

// Ensure upload dir exists
await fs.mkdir(uploadDir, { recursive: true });

// List books for authenticated user
router.get('/', requireAuth, (req, res) => {
  const user = req.user as User;
  const books = db
    .prepare('SELECT * FROM books WHERE userId = ? ORDER BY updatedAt DESC')
    .all(user.id) as Book[];

  const booksWithChapters = books.map(book => {
    const chapters = db
      .prepare('SELECT id, name, type, \`order\` FROM chapters WHERE bookId = ? ORDER BY \`order\`')
      .all(book.id) as Array<{ id: string; name: string; type: ChapterType; order: number }>;
    const readings = db
      .prepare('SELECT chapterId, scrollPosition, updatedAt FROM readings WHERE userId = ? AND bookId = ?')
      .all(user.id, book.id) as Array<{ chapterId: string; scrollPosition: number; updatedAt: number }>;
    return { ...book, chapters, readings };
  });

  res.json(booksWithChapters);
});

// Create book
router.post('/', requireAuth, upload.array('files'), async (req, res) => {
  const user = req.user as User;
  const { title } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files provided' });
    return;
  }

  try {
    const bookId = crypto.randomUUID();
    const now = Date.now();

    db.prepare('INSERT INTO books (id, userId, title, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)')
      .run(bookId, user.id, title, now, now);

    const chapters = files
      .sort((a, b) => a.originalname.localeCompare(b.originalname))
      .map((file, idx) => ({
        id: crypto.randomUUID(),
        bookId,
        name: path.parse(file.originalname).name,
        filename: file.filename,
        type: chapterTypeFromExt(file.originalname) ?? 'markdown',
        order: idx,
        createdAt: now,
      }));

    const stmt = db.prepare(
      'INSERT INTO chapters (id, bookId, name, filename, type, \`order\`, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const ch of chapters) {
      stmt.run(ch.id, ch.bookId, ch.name, ch.filename, ch.type, ch.order, ch.createdAt);
    }

    res.json({ id: bookId, title, chapters });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create book' });
  }
});

// Reorder chapters
router.put('/:bookId/chapters/reorder', requireAuth, (req, res) => {
  const user = req.user as User;
  const { bookId } = req.params;
  const { chapterIds } = req.body as { chapterIds: string[] };

  try {
    const book = db.prepare('SELECT * FROM books WHERE id = ? AND userId = ?').get(bookId, user.id);
    if (!book) { res.status(404).json({ error: 'Book not found' }); return; }

    const stmt = db.prepare('UPDATE chapters SET `order` = ? WHERE id = ? AND bookId = ?');
    const update = db.transaction(() => {
      chapterIds.forEach((id, idx) => stmt.run(idx, id, bookId));
    });
    update();
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to reorder chapters' });
  }
});

// Get chapter content
router.get('/:bookId/chapters/:chapterId', requireAuth, async (req, res) => {
  const user = req.user as User;
  const { bookId, chapterId } = req.params;

  try {
    const chapter = db
      .prepare(
        'SELECT c.* FROM chapters c JOIN books b ON c.bookId = b.id WHERE c.id = ? AND c.bookId = ? AND b.userId = ?'
      )
      .get(chapterId, bookId, user.id) as Chapter | undefined;

    if (!chapter) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    const filePath = path.join(uploadDir, chapter.filename);
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ content, type: chapter.type });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read chapter' });
  }
});

// Update reading progress
router.post('/:bookId/chapters/:chapterId/progress', requireAuth, (req, res) => {
  const user = req.user as User;
  const { bookId, chapterId } = req.params;
  const { scrollPosition } = req.body;

  try {
    const chapter = db
      .prepare('SELECT c.* FROM chapters c JOIN books b ON c.bookId = b.id WHERE c.id = ? AND b.userId = ?')
      .get(chapterId, user.id);

    if (!chapter) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    const readingId = crypto.randomUUID();
    db.prepare(
      'INSERT OR REPLACE INTO readings (id, userId, bookId, chapterId, scrollPosition, updatedAt) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(readingId, user.id, bookId, chapterId, scrollPosition, Date.now());

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Delete book
router.delete('/:bookId', requireAuth, (req, res) => {
  const user = req.user as User;
  const { bookId } = req.params;

  try {
    const book = db
      .prepare('SELECT * FROM books WHERE id = ? AND userId = ?')
      .get(bookId, user.id) as Book | undefined;

    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    db.prepare('DELETE FROM books WHERE id = ?').run(bookId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

export default router;
