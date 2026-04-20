import { useState } from 'react';
import type { Book } from '../types';

interface Props {
  book: Book;
  onSelect: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClose: () => void;
}

export function ChapterNav({ book, onSelect, onReorder, onClose }: Props) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDragStart(i: number) {
    setDragIndex(i);
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    setOverIndex(i);
  }

  function handleDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== i) onReorder(dragIndex, i);
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

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
          <li
            key={chapter.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={e => handleDragOver(e, i)}
            onDrop={e => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            className={`flex items-center group/item transition-colors ${
              overIndex === i && dragIndex !== i ? 'border-t-2 border-neutral-400' : 'border-t-2 border-transparent'
            } ${dragIndex === i ? 'opacity-40' : ''}`}
          >
            <span
              className="pl-2 pr-1 py-2.5 text-neutral-200 hover:text-neutral-400 cursor-grab active:cursor-grabbing shrink-0"
              aria-hidden
            >
              <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                <circle cx="3" cy="2.5" r="1.2"/><circle cx="7" cy="2.5" r="1.2"/>
                <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
                <circle cx="3" cy="11.5" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/>
              </svg>
            </span>
            <button
              onClick={() => onSelect(i)}
              className={`flex-1 text-left pr-4 py-2.5 text-sm transition-colors ${
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
