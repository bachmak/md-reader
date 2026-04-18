import { create } from 'zustand';
import type { Book } from '../types';
import type { DriveFile } from '../lib/google';
import { saveBook, getAllBooks, deleteBook } from '../lib/db';

interface BookState {
  books: Book[];
  currentBook: Book | null;
  isLoading: boolean;
  loadBooks: () => Promise<void>;
  createBook: (files: DriveFile[]) => Promise<void>;
  openBook: (book: Book) => void;
  closeBook: () => void;
  removeBook: (id: string) => Promise<void>;
  setCurrentChapter: (index: number) => void;
  updateScrollPosition: (chapterIndex: number, scrollTop: number) => void;
}

export const useBookStore = create<BookState>((set, get) => ({
  books: [],
  currentBook: null,
  isLoading: false,

  loadBooks: async () => {
    set({ isLoading: true });
    const books = await getAllBooks();
    set({ books, isLoading: false });
  },

  createBook: async (files: DriveFile[]) => {
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));
    const book: Book = {
      id: crypto.randomUUID(),
      title: sorted[0].name,
      chapters: sorted.map(f => ({ name: f.name, driveFileId: f.id })),
      currentChapterIndex: 0,
      scrollPositions: {},
      createdAt: Date.now(),
      lastOpenedAt: Date.now(),
    };
    await saveBook(book);
    set(state => ({ books: [book, ...state.books], currentBook: book }));
  },

  openBook: (book: Book) => {
    const updated = { ...book, lastOpenedAt: Date.now() };
    saveBook(updated);
    set({ currentBook: updated });
  },

  closeBook: () => set({ currentBook: null }),

  removeBook: async (id: string) => {
    await deleteBook(id);
    set(state => ({
      books: state.books.filter(b => b.id !== id),
      currentBook: state.currentBook?.id === id ? null : state.currentBook,
    }));
  },

  setCurrentChapter: (index: number) => {
    const { currentBook } = get();
    if (!currentBook) return;
    const updated = { ...currentBook, currentChapterIndex: index, lastOpenedAt: Date.now() };
    saveBook(updated);
    set({ currentBook: updated });
  },

  updateScrollPosition: (chapterIndex: number, scrollTop: number) => {
    const { currentBook } = get();
    if (!currentBook) return;
    const updated = {
      ...currentBook,
      scrollPositions: { ...currentBook.scrollPositions, [chapterIndex]: scrollTop },
    };
    saveBook(updated);
    set({ currentBook: updated });
  },
}));
