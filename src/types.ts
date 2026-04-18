export interface Chapter {
  name: string;
  driveFileId: string;
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
