export interface User {
  id: string;
  googleId: string;
  email: string;
  createdAt: number;
}

export interface Book {
  id: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Chapter {
  id: string;
  bookId: string;
  name: string;
  filename: string;
  order: number;
  createdAt: number;
}

export interface Reading {
  id: string;
  userId: string;
  bookId: string;
  chapterId: string;
  scrollPosition: number;
  updatedAt: number;
}
