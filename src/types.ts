export interface User {
  id: string;
  email: string;
  googleId: string;
  createdAt: number;
}

export type ChapterType = 'markdown' | 'html';

export interface Chapter {
  id: string;
  name: string;
  type: ChapterType;
  order: number;
}

export interface Book {
  id: string;
  title: string;
  chapters: Chapter[];
  currentChapterIndex: number;
  scrollPositions: Record<number, number>;
  createdAt: number;
  updatedAt: number;
}

