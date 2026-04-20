import { create } from 'zustand';
import type { Book } from '../types';

interface BookState {
  books: Book[];
  currentBook: Book | null;
  isLoading: boolean;
  loadBooks: () => Promise<void>;
  createBook: (title: string, files: File[]) => Promise<void>;
  openBook: (book: Book) => void;
  closeBook: () => void;
  removeBook: (id: string) => Promise<void>;
  setCurrentChapter: (index: number) => void;
  updateScrollPosition: (chapterId: string, scrollTop: number) => Promise<void>;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  currentBook: null,
  isLoading: false,

  loadBooks: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/books', { credentials: 'include' });
      const raw = (await res.json()) as (Book & {
        readings?: { chapterId: string; scrollPosition: number; updatedAt: number }[];
      })[];
      const books = raw.map(b => {
        const readings = b.readings ?? [];
        const scrollPositions: Record<number, number> = {};
        readings.forEach(r => {
          const idx = b.chapters.findIndex(c => c.id === r.chapterId);
          if (idx !== -1) scrollPositions[idx] = r.scrollPosition;
        });
        const lastReading = readings.sort((a, z) => z.updatedAt - a.updatedAt)[0];
        const currentChapterIndex = lastReading
          ? Math.max(0, b.chapters.findIndex(c => c.id === lastReading.chapterId))
          : 0;
        return { ...b, currentChapterIndex, scrollPositions };
      });
      set({ books, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createBook: async (title: string, files: File[]) => {
    try {
      const formData = new FormData();
      formData.append('title', title);
      files.forEach(file => formData.append('files', file));

      const res = await fetch('/api/books', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (res.ok) {
        const raw = await res.json();
        const book = { ...raw, currentChapterIndex: 0, scrollPositions: {} };
        set(state => ({ books: [book, ...state.books], currentBook: book }));
      }
    } catch (err) {
      console.error('Failed to create book:', err);
    }
  },

  openBook: (book: Book) => {
    set({ currentBook: book });
  },

  closeBook: () => set({ currentBook: null }),

  removeBook: async (id: string) => {
    try {
      await fetch(`/api/books/${id}`, { method: 'DELETE', credentials: 'include' });
      set(state => ({
        books: state.books.filter(b => b.id !== id),
        currentBook: state.currentBook?.id === id ? null : state.currentBook,
      }));
    } catch (err) {
      console.error('Failed to delete book:', err);
    }
  },

  setCurrentChapter: (index: number) => {
    const { currentBook } = get();
    if (!currentBook) return;
    const chapter = currentBook.chapters[index];
    set({ currentBook: { ...currentBook, currentChapterIndex: index } });
    fetch(`/api/books/${currentBook.id}/chapters/${chapter.id}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scrollPosition: currentBook.scrollPositions[index] ?? 0 }),
      credentials: 'include',
    }).catch(() => {});
  },

  updateScrollPosition: async (chapterId: string, scrollTop: number) => {
    const { currentBook } = get();
    if (!currentBook) return;

    const idx = currentBook.chapters.findIndex(c => c.id === chapterId);
    if (idx !== -1) {
      const scrollPositions = { ...currentBook.scrollPositions, [idx]: scrollTop };
      set({ currentBook: { ...currentBook, scrollPositions } });
    }

    fetch(`/api/books/${currentBook.id}/chapters/${chapterId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scrollPosition: scrollTop }),
      credentials: 'include',
    }).catch(err => console.error('Failed to save progress:', err));
  },
}));
