import { useState } from 'react';
import { useBookStore } from '../store/bookStore';
import { useAuthStore } from '../store/authStore';

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(ts);
}

export function BookshelfView() {
  const { books, isLoading, createBook, openBook, removeBook } = useBookStore();
  const { user, signIn, signOut } = useAuthStore();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !files || files.length === 0) return;

    setIsCreating(true);
    await createBook(title, Array.from(files));
    setTitle('');
    setFiles(null);
    setIsCreating(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-neutral-400 dark:text-neutral-500 text-sm bg-neutral-50 dark:bg-neutral-900">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-xl mx-auto px-6 py-14">
        <div className="flex items-baseline justify-between mb-10">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">Library</h1>
          {user ? (
            <button
              onClick={() => signOut()}
              className="text-sm px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={signIn}
              className="text-sm px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-700 dark:hover:bg-neutral-300 transition-colors"
            >
              Sign in with Google
            </button>
          )}
        </div>

        {!user ? (
          <div className="text-center mt-24 text-neutral-400 dark:text-neutral-500">
            <p className="text-sm">Sign in to get started.</p>
          </div>
        ) : isCreating ? (
          <div className="text-center mt-24 text-neutral-400 dark:text-neutral-500">
            <p className="text-sm">Creating book...</p>
          </div>
        ) : (
          <>
            {/* Upload form */}
            <form onSubmit={handleSubmit} className="mb-10 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Book title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., My Markdown Book"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-400"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Markdown files</label>
                <input
                  type="file"
                  multiple
                  accept=".md,.markdown,.txt"
                  onChange={e => setFiles(e.target.files)}
                  className="w-full text-sm text-neutral-600 dark:text-neutral-400"
                />
              </div>
              <button
                type="submit"
                disabled={!title || !files || files.length === 0}
                className="w-full px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-md hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Create book
              </button>
            </form>

            {/* Books list */}
            {books.length === 0 ? (
              <div className="text-center mt-12 text-neutral-400 dark:text-neutral-500">
                <p className="text-sm">No books yet. Upload markdown files above.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {books.map(book => {
                  const current = book.chapters[book.currentChapterIndex];
                  return (
                    <li
                      key={book.id}
                      className="group bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-5 py-4 flex items-center gap-4 cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
                      onClick={() => openBook(book)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{book.title}</p>
                        <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-0.5">
                          {book.chapters.length === 1
                            ? '1 chapter'
                            : `${book.chapters.length} chapters · last on "${current?.name}"`}
                        </p>
                        <p className="text-xs text-neutral-300 dark:text-neutral-600 mt-1">{formatDate(book.updatedAt)}</p>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          removeBook(book.id);
                        }}
                        className="text-neutral-300 dark:text-neutral-600 hover:text-red-400 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-sm px-2 py-1"
                        aria-label="Delete book"
                      >
                        Delete
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
