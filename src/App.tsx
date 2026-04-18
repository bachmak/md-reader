import { useEffect } from 'react';
import { useBookStore } from './store/bookStore';
import { useAuthStore } from './store/authStore';
import { BookshelfView } from './components/BookshelfView';
import { ReaderView } from './components/ReaderView';

export function App() {
  const currentBook = useBookStore(s => s.currentBook);
  const loadBooks = useBookStore(s => s.loadBooks);
  const init = useAuthStore(s => s.init);

  useEffect(() => {
    init();
    loadBooks();
  }, [init, loadBooks]);

  return currentBook ? <ReaderView /> : <BookshelfView />;
}
