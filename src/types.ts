export interface User {
  id: string;
  email: string;
  googleId: string;
  createdAt: number;
}

export interface Chapter {
  id: string;
  name: string;
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

