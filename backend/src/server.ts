import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';
import authRouter from './routes/auth.js';
import booksRouter from './routes/books.js';
import { requireAuth } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

initDb();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.APP_URL : 'http://localhost:5173',
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);
app.use('/api/books', requireAuth, booksRouter);

// Serve frontend
const frontendDir = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, 'public')
  : path.join(__dirname, '..', '..', 'dist');
app.use(express.static(frontendDir));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
