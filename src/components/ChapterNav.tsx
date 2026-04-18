import type { Book } from '../types';

interface Props {
  book: Book;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export function ChapterNav({ book, onSelect, onClose }: Props) {
  return (
    <nav className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Chapters</span>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-700 w-6 h-6 flex items-center justify-center rounded"
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto py-2">
        {book.chapters.map((chapter, i) => (
          <li key={i}>
            <button
              onClick={() => onSelect(i)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                i === book.currentChapterIndex
                  ? 'text-neutral-900 font-medium bg-white'
                  : 'text-neutral-500 hover:text-neutral-800 hover:bg-white/60'
              }`}
            >
              <span className="text-neutral-300 mr-2 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              {chapter.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
