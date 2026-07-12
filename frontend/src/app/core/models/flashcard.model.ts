export type FlashcardSetColor =
  | 'blue'
  | 'purple'
  | 'green'
  | 'orange'
  | 'red'
  | 'cyan';

export interface Flashcard {
  id: number;
  front: string;
  back: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardSet {
  id: number;
  title: string;
  description: string;
  folder: string;
  color: FlashcardSetColor;
  favorite: boolean;
  progress: number;
  createdAt: string;
  updatedAt: string;
  cards: Flashcard[];
}

export interface CreateFlashcardSetInput {
  title: string;
  description: string;
  folder: string;
  color: FlashcardSetColor;
}
