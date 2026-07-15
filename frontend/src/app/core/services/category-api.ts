import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { CategoryRequest, CategoryResponse } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryApi {
  constructor(private readonly http: HttpClient) {}

  getCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(`${API_BASE_URL}/categories`);
  }

  createCategory(request: CategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(
      `${API_BASE_URL}/categories`,
      request,
    );
  }

  updateCategory(
    categoryId: number,
    request: CategoryRequest,
  ): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(
      `${API_BASE_URL}/categories/${categoryId}`,
      request,
    );
  }

  deleteCategory(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/categories/${categoryId}`);
  }
}
