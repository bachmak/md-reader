# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (root)
```bash
npm run dev        # Vite dev server on localhost:5173
npm run build      # TypeScript check + Vite production build
npm run preview    # Preview production build
```

### Backend (`/backend`)
```bash
npm run dev        # tsx watch mode (hot reload)
npm run build      # TypeScript compile to /backend/dist
npm run start      # Run compiled backend
```

### Docker
```bash
docker compose up --build   # Full stack production build and run
```

The backend requires a `.env` file (see `.env.example`) with `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET`. In dev the backend runs on port 3000 and the frontend proxies API/auth requests to it.

## Architecture

MD Reader is a full-stack markdown book reader with Google OAuth authentication. The repo is a monorepo: the root is the frontend (React + Vite), and `/backend` is a separate Node.js project.

### Frontend (`/src`)

React 19 + TypeScript SPA with two top-level views:
- **BookshelfView**: library listing, book creation, and auth UI
- **ReaderView**: chapter-based markdown reader with sidebar nav, scroll restoration, and drag-to-reorder chapters

State is managed by two Zustand stores:
- `authStore.ts` — Google OAuth session state
- `bookStore.ts` — books, chapters, reading progress; stores optimistically update the UI then sync to the backend async

`lib/db.ts` is an IndexedDB wrapper used for client-side caching.

Markdown is rendered client-side via `react-markdown` + `remark-gfm`. Tailwind CSS v4 with `@tailwindcss/typography` handles styling including dark mode (system preference).

### Backend (`/backend/src`)

Express + TypeScript API with:
- **Passport.js + Google OAuth 2.0** for authentication; 7-day sessions stored server-side
- **SQLite** (better-sqlite3, WAL mode) with tables: `users`, `books`, `chapters`, `readings`
- **Routes**: `/auth/*` (OAuth flow), `/api/books/*` (CRUD, file upload, progress)
- **Multer** handles `.md`/`.markdown`/`.txt` uploads; files stored with `crypto.randomUUID` filenames

### Data flow

The frontend calls the backend API for all persistent data. The backend owns the database (SQLite at `/data/md-reader.db`) and uploaded files (`/data/uploads`). Both paths are bind-mounted from the host in Docker Compose for persistence across deploys.

### Production deployment

GitHub Actions SSHs into the server and runs `docker compose up --build -d` on push to `master`. Docker uses a multi-stage build: frontend dist is copied into the backend image and served as static files from `/app/dist/public`.
