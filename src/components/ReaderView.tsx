import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useBookStore } from '../store/bookStore';
import { ChapterNav } from './ChapterNav';
import type { ChapterType } from '../types';

function sanitizeHtml(raw: string): string {
  const doc = new DOMParser().parseFromString(raw, 'text/html');
  doc.querySelectorAll('style').forEach(el => el.remove());
  doc.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
  return doc.body.innerHTML;
}

export function ReaderView() {
  const currentBook = useBookStore(s => s.currentBook);
  const closeBook = useBookStore(s => s.closeBook);
  const setCurrentChapter = useBookStore(s => s.setCurrentChapter);
  const updateScrollPosition = useBookStore(s => s.updateScrollPosition);
  const reorderChapters = useBookStore(s => s.reorderChapters);

  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<ChapterType>('markdown');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadTrigger, setLoadTrigger] = useState(0);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!currentBook) return;

    const book = currentBook;
    const chapterIndex = book.currentChapterIndex;
    const chapter = book.chapters[chapterIndex];

    async function load() {
      try {
        setError(null);
        const res = await fetch(`/api/books/${book.id}/chapters/${chapter.id}`, {
          credentials: 'include',
        });
        const data = (await res.json()) as { content: string; type: ChapterType };
        setContent(data.content);
        setContentType(data.type);

        const savedScroll = book.scrollPositions[chapterIndex] ?? 0;
        requestAnimationFrame(() => {
          window.scrollTo(0, savedScroll);
        });
      } catch {
        setError('Could not load chapter.');
      }
    }

    load();
  }, [currentBook?.id, currentBook?.currentChapterIndex, loadTrigger]);

  const handleScroll = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      if (!currentBook) return;
      const chapter = currentBook.chapters[currentBook.currentChapterIndex];
      updateScrollPosition(chapter.id, window.scrollY);
    }, 400);
  }, [currentBook, updateScrollPosition]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (!currentBook) return null;

  const chapter = currentBook.chapters[currentBook.currentChapterIndex];
  const showSidebar = sidebarOpen && currentBook.chapters.length > 1;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <header className="sticky top-0 z-10 flex items-center gap-3 px-4 h-12 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
        {currentBook.chapters.length > 1 && (
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 rounded transition-colors"
            aria-label="Toggle chapters"
          >
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
              <rect width="16" height="2" rx="1" />
              <rect y="5" width="16" height="2" rx="1" />
              <rect y="10" width="16" height="2" rx="1" />
            </svg>
          </button>
        )}

        <div className="flex-1 min-w-0 text-sm">
          {currentBook.chapters.length > 1 ? (
            <>
              <span className="text-neutral-400 dark:text-neutral-500">{currentBook.title}</span>
              <span className="text-neutral-300 dark:text-neutral-600 mx-1.5">·</span>
              <span className="text-neutral-700 dark:text-neutral-200 font-medium">{chapter.name}</span>
            </>
          ) : (
            <span className="text-neutral-700 dark:text-neutral-200 font-medium">{chapter.name}</span>
          )}
        </div>

        <button
          onClick={closeBook}
          className="text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 px-2 py-1 rounded transition-colors"
        >
          Library
        </button>
      </header>

      <div className="flex">
        {showSidebar && (
          <aside className="sticky top-12 h-[calc(100vh-3rem)] w-56 border-r border-neutral-200 dark:border-neutral-700 shrink-0 overflow-y-auto bg-neutral-50 dark:bg-neutral-800">
            <ChapterNav
              book={currentBook}
              onSelect={i => {
                setCurrentChapter(i);
                setSidebarOpen(false);
              }}
              onReorder={(from, to) => reorderChapters(from, to)}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        )}

        <main className="flex-1 min-w-0">
          {error ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3rem)] gap-3 text-neutral-500 dark:text-neutral-400 text-sm">
              <p className="max-w-xs text-center">{error}</p>
              <button
                onClick={() => setLoadTrigger(t => t + 1)}
                className="underline hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <article className="prose prose-neutral dark:prose-invert mx-auto px-8 py-14">
              {contentType === 'html' ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              )}
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
