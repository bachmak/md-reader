import { useEffect } from 'react';
import { useBookStore } from './store/bookStore';
import { useAuthStore } from './store/authStore';
import { BookshelfView } from './components/BookshelfView';
import { ReaderView } from './components/ReaderView';

export function App() {
  const currentBook = useBookStore(s => s.currentBook);
  const loadBooks = useBookStore(s => s.loadBooks);
  const init = useAuthStore(s => s.init);
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user) loadBooks();
  }, [user, loadBooks]);

  return currentBook ? <ReaderView /> : <BookshelfView />;
}
