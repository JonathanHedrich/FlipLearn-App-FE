export type FlashcardSetColor =
  | 'blue'
  | 'purple'
  | 'green'
  | 'orange'
  | 'red'
  | 'cyan';

export interface FlashcardSetResponse {
  id: number;
  title: string;
  description: string | null;

  categoryId: number | null;
  categoryName: string | null;

  color: FlashcardSetColor;
  favorite: boolean;
  cardCount: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlashcardSetRequest {
  title: string;
  description: string | null;
  categoryId: number | null;
  color: FlashcardSetColor;
}

export interface UpdateFlashcardSetRequest {
  title: string;
  description: string | null;
  categoryId: number | null;
  color: FlashcardSetColor;
  favorite: boolean;
}

export interface FlashcardResponse {
  id: number;
  setId: number;
  front: string;
  back: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFlashcardRequest {
  front: string;
  back: string;
}

export interface UpdateFlashcardRequest {
  front: string;
  back: string;
  favorite: boolean;
}
