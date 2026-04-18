import { useEffect } from 'react';
import { useBookStore } from './store/bookStore';
import { BookshelfView } from './components/BookshelfView';
import { ReaderView } from './components/ReaderView';

export function App() {
  const currentBook = useBookStore(s => s.currentBook);
  const loadBooks = useBookStore(s => s.loadBooks);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  return currentBook ? <ReaderView /> : <BookshelfView />;
}
