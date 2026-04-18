import { create } from 'zustand';
import type { Book, Chapter } from '../types';
import { saveBook, getAllBooks, deleteBook } from '../lib/db';

interface BookState {
  books: Book[];
  currentBook: Book | null;
  isLoading: boolean;
  loadBooks: () => Promise<void>;
  createBook: (handles: FileSystemFileHandle[]) => Promise<void>;
  openBook: (book: Book) => void;
  closeBook: () => void;
  removeBook: (id: string) => Promise<void>;
  setCurrentChapter: (index: number) => void;
  updateScrollPosition: (chapterIndex: number, scrollTop: number) => void;
}

function chapterFromHandle(handle: FileSystemFileHandle): Chapter {
  return { name: handle.name.replace(/\.(md|markdown)$/i, ''), handle };
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

  createBook: async (handles: FileSystemFileHandle[]) => {
    const sorted = [...handles].sort((a, b) => a.name.localeCompare(b.name));
    const chapters = sorted.map(chapterFromHandle);
    const book: Book = {
      id: crypto.randomUUID(),
      title: chapters[0].name,
      chapters,
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
