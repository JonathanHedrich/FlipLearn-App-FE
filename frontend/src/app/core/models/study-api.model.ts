export type StudyRating = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export interface StartStudySessionRequest {
  setId: number;
  mode: StudyMode;
}

export interface StudyCardResponse {
  id: number;
  front: string;
  back: string;
  favorite: boolean;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string | null;
}

export interface StudySessionResponse {
  sessionId: number;
  setId: number;
  setTitle: string;
  startedAt: string;
  totalCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
  completed: boolean;
  cards: StudyCardResponse[];
}

export interface SubmitReviewRequest {
  cardId: number;
  rating: StudyRating;
}

export interface StudyReviewResponse {
  reviewId: number;
  sessionId: number;
  cardId: number;
  rating: StudyRating;
  answeredCorrectly: boolean;
  previousIntervalDays: number;
  newIntervalDays: number;
  previousEaseFactor: number;
  newEaseFactor: number;
  nextReviewAt: string;
  sessionComplete: boolean;
  correctAnswers: number;
  incorrectAnswers: number;
  setProgress: number;
}

export type StudyMode = 'DUE' | 'ALL';
