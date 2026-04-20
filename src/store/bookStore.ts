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
      const raw = (await res.json()) as Book[];
      const books = raw.map(b => ({
        ...b,
        currentChapterIndex: b.currentChapterIndex ?? 0,
        scrollPositions: b.scrollPositions ?? {},
      }));
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
    if (currentBook) {
      set({ currentBook: { ...currentBook, currentChapterIndex: index } });
    }
  },

  updateScrollPosition: async (chapterId: string, scrollTop: number) => {
    const { currentBook } = get();
    if (!currentBook) return;

    try {
      await fetch(`/api/books/${currentBook.id}/chapters/${chapterId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scrollPosition: scrollTop }),
        credentials: 'include',
      });
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  },
}));
