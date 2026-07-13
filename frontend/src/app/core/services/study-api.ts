import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import {
  StartStudySessionRequest,
  StudyReviewResponse,
  StudySessionResponse,
  SubmitReviewRequest,
} from '../models/study-api.model';

@Injectable({
  providedIn: 'root',
})
export class StudyApi {
  constructor(private readonly http: HttpClient) {}

  startSession(
    request: StartStudySessionRequest,
  ): Observable<StudySessionResponse> {
    return this.http.post<StudySessionResponse>(
      `${API_BASE_URL}/study/sessions`,
      request,
    );
  }

  getSession(sessionId: number): Observable<StudySessionResponse> {
    return this.http.get<StudySessionResponse>(
      `${API_BASE_URL}/study/sessions/${sessionId}`,
    );
  }

  submitReview(
    sessionId: number,
    request: SubmitReviewRequest,
  ): Observable<StudyReviewResponse> {
    return this.http.post<StudyReviewResponse>(
      `${API_BASE_URL}/study/sessions/${sessionId}/reviews`,
      request,
    );
  }
}
