import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { StatisticsOverviewResponse } from '../models/statistics-api.model';

@Injectable({
  providedIn: 'root',
})
export class StatisticsApi {
  constructor(private readonly http: HttpClient) {}

  getOverview(): Observable<StatisticsOverviewResponse> {
    return this.http.get<StatisticsOverviewResponse>(
      `${API_BASE_URL}/statistics/overview`,
    );
  }
}
