import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useBookStore } from '../store/bookStore';
import { ChapterNav } from './ChapterNav';

export function ReaderView() {
  const currentBook = useBookStore(s => s.currentBook);
  const closeBook = useBookStore(s => s.closeBook);
  const setCurrentChapter = useBookStore(s => s.setCurrentChapter);
  const updateScrollPosition = useBookStore(s => s.updateScrollPosition);

  const [content, setContent] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadTrigger, setLoadTrigger] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!currentBook) return;

    const chapterIndex = currentBook.currentChapterIndex;
    const chapter = currentBook.chapters[chapterIndex];

    async function load() {
      try {
        const perm = await chapter.handle.queryPermission({ mode: 'read' });
        if (perm !== 'granted') {
          const req = await chapter.handle.requestPermission({ mode: 'read' });
          if (req !== 'granted') {
            setError('File access was denied. Click retry and grant permission when prompted.');
            return;
          }
        }
        setError(null);
        const file = await chapter.handle.getFile();
        setContent(await file.text());

        const savedScroll = currentBook.scrollPositions[chapterIndex] ?? 0;
        requestAnimationFrame(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = savedScroll;
        });
      } catch {
        setError('Could not read the file. It may have been moved or deleted.');
      }
    }

    load();
  }, [currentBook?.id, currentBook?.currentChapterIndex, loadTrigger]);

  const handleScroll = useCallback(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!scrollRef.current || !currentBook) return;
      updateScrollPosition(currentBook.currentChapterIndex, scrollRef.current.scrollTop);
    }, 400);
  }, [currentBook, updateScrollPosition]);

  if (!currentBook) return null;

  const chapter = currentBook.chapters[currentBook.currentChapterIndex];
  const showSidebar = sidebarOpen && currentBook.chapters.length > 1;

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="flex items-center gap-3 px-4 h-12 border-b border-neutral-200 shrink-0">
        {currentBook.chapters.length > 1 && (
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-800 rounded transition-colors"
            aria-label="Toggle chapters"
          >
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
              <rect width="16" height="2" rx="1"/>
              <rect y="5" width="16" height="2" rx="1"/>
              <rect y="10" width="16" height="2" rx="1"/>
            </svg>
          </button>
        )}

        <div className="flex-1 min-w-0 text-sm">
          {currentBook.chapters.length > 1 ? (
            <>
              <span className="text-neutral-400">{currentBook.title}</span>
              <span className="text-neutral-300 mx-1.5">·</span>
              <span className="text-neutral-700 font-medium">{chapter.name}</span>
            </>
          ) : (
            <span className="text-neutral-700 font-medium">{chapter.name}</span>
          )}
        </div>

        <button
          onClick={closeBook}
          className="text-sm text-neutral-400 hover:text-neutral-700 px-2 py-1 rounded transition-colors"
        >
          Library
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        {showSidebar && (
          <aside className="w-56 border-r border-neutral-200 shrink-0 overflow-y-auto bg-neutral-50">
            <ChapterNav
              book={currentBook}
              onSelect={i => { setCurrentChapter(i); setSidebarOpen(false); }}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        )}

        <main ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-neutral-500 text-sm">
              <p className="max-w-xs text-center">{error}</p>
              <button
                onClick={() => setLoadTrigger(t => t + 1)}
                className="underline hover:text-neutral-800"
              >
                Retry
              </button>
            </div>
          ) : (
            <article className="prose prose-neutral mx-auto px-8 py-14">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </article>
          )}
        </main>
      </div>
    </div>
  );
}
