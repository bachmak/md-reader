import { useBookStore } from '../store/bookStore';
import { useAuthStore } from '../store/authStore';
import { openDrivePicker } from '../lib/google';

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(ts);
}

export function BookshelfView() {
  const { books, isLoading, createBook, openBook, removeBook } = useBookStore();
  const { accessToken, ready, signIn } = useAuthStore();

  const handleNewBook = () => {
    if (!accessToken) { signIn(); return; }
    openDrivePicker(accessToken, async (files) => {
      if (files.length > 0) await createBook(files);
    });
  };

  if (!ready || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-neutral-400 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-xl mx-auto px-6 py-14">
        <div className="flex items-baseline justify-between mb-10">
          <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Library</h1>
          {accessToken ? (
            <button
              onClick={handleNewBook}
              className="text-sm px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-700 transition-colors"
            >
              + New book
            </button>
          ) : (
            <button
              onClick={signIn}
              className="text-sm px-4 py-2 bg-neutral-900 text-white rounded-md hover:bg-neutral-700 transition-colors"
            >
              Sign in with Google
            </button>
          )}
        </div>

        {books.length === 0 ? (
          <div className="text-center mt-24 text-neutral-400">
            <p className="text-sm">No books yet.</p>
            <p className="text-sm mt-1">
              {accessToken
                ? 'Pick markdown files from Google Drive to get started.'
                : 'Sign in with Google to add books from your Drive.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {books.map(book => {
              const current = book.chapters[book.currentChapterIndex];
              return (
                <li
                  key={book.id}
                  className="group bg-white border border-neutral-200 rounded-lg px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-neutral-400 transition-colors"
                  onClick={() => openBook(book)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 truncate">{book.title}</p>
                    <p className="text-sm text-neutral-400 mt-0.5">
                      {book.chapters.length === 1
                        ? '1 chapter'
                        : `${book.chapters.length} chapters · last on "${current?.name}"`}
                    </p>
                    <p className="text-xs text-neutral-300 mt-1">{formatDate(book.lastOpenedAt)}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); removeBook(book.id); }}
                    className="text-neutral-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm px-2 py-1"
                    aria-label="Delete book"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
