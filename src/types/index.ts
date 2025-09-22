export interface Book {
  id: string;
  title: string;
  author: string;
  description?: string;
  imageUrl?: string;
  isbn?: string;
  publishedDate?: string;
  genre?: string;
  isAvailable: boolean;
  borrowedBy?: string;
  borrowedDate?: string;
  sourceUrl?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  registrationDate: string;
  borrowedBooks: string[];
}

export interface BookMetadata {
  title: string;
  author: string;
  description?: string;
  imageUrl?: string;
  isbn?: string;
  publishedDate?: string;
}