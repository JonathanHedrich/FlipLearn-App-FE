import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import {
  CreateFlashcardRequest,
  CreateFlashcardSetRequest,
  FlashcardResponse,
  FlashcardSetResponse,
  UpdateFlashcardRequest,
  UpdateFlashcardSetRequest,
} from '../models/flashcard-api.model';

@Injectable({
  providedIn: 'root',
})
export class FlashcardApi {
  constructor(private readonly http: HttpClient) {}

  getSets(): Observable<FlashcardSetResponse[]> {
    return this.http.get<FlashcardSetResponse[]>(`${API_BASE_URL}/sets`);
  }

  getSet(setId: number): Observable<FlashcardSetResponse> {
    return this.http.get<FlashcardSetResponse>(`${API_BASE_URL}/sets/${setId}`);
  }

  createSet(
    request: CreateFlashcardSetRequest,
  ): Observable<FlashcardSetResponse> {
    return this.http.post<FlashcardSetResponse>(
      `${API_BASE_URL}/sets`,
      request,
    );
  }

  updateSet(
    setId: number,
    request: UpdateFlashcardSetRequest,
  ): Observable<FlashcardSetResponse> {
    return this.http.put<FlashcardSetResponse>(
      `${API_BASE_URL}/sets/${setId}`,
      request,
    );
  }

  deleteSet(setId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/sets/${setId}`);
  }

  getCards(setId: number): Observable<FlashcardResponse[]> {
    return this.http.get<FlashcardResponse[]>(
      `${API_BASE_URL}/sets/${setId}/cards`,
    );
  }

  createCard(
    setId: number,
    request: CreateFlashcardRequest,
  ): Observable<FlashcardResponse> {
    return this.http.post<FlashcardResponse>(
      `${API_BASE_URL}/sets/${setId}/cards`,
      request,
    );
  }

  updateCard(
    setId: number,
    cardId: number,
    request: UpdateFlashcardRequest,
  ): Observable<FlashcardResponse> {
    return this.http.put<FlashcardResponse>(
      `${API_BASE_URL}/sets/${setId}/cards/${cardId}`,
      request,
    );
  }

  deleteCard(setId: number, cardId: number): Observable<void> {
    return this.http.delete<void>(
      `${API_BASE_URL}/sets/${setId}/cards/${cardId}`,
    );
  }
}
