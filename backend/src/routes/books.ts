import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import db from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { User, Book, Chapter } from '../types.js';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
const upload = multer({
  dest: uploadDir,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.md', '.markdown', '.txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only markdown files allowed'));
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
      .prepare('SELECT id, name, \`order\` FROM chapters WHERE bookId = ? ORDER BY \`order\`')
      .all(book.id) as Array<{ id: string; name: string; order: number }>;
    return { ...book, chapters };
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
        order: idx,
        createdAt: now,
      }));

    const stmt = db.prepare(
      'INSERT INTO chapters (id, bookId, name, filename, \`order\`, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const ch of chapters) {
      stmt.run(ch.id, ch.bookId, ch.name, ch.filename, ch.order, ch.createdAt);
    }

    res.json({ id: bookId, title, chapters });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create book' });
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
    res.json({ content });
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
