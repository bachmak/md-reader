export interface Chapter {
  name: string;
  handle: FileSystemFileHandle;
}

export interface Book {
  id: string;
  title: string;
  chapters: Chapter[];
  currentChapterIndex: number;
  scrollPositions: Record<number, number>;
  createdAt: number;
  lastOpenedAt: number;
}
