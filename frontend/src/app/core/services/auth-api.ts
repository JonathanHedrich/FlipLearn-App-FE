import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';

import {
  ChangeEmailRequest,
  ChangePasswordRequest,
  CurrentUserResponse,
  GoogleLoginRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UpdateProfileRequest,
  UserProfileResponse,
} from '../models/auth.model';

const TOKEN_STORAGE_KEY = 'fliplearn.accessToken';
const USER_STORAGE_KEY = 'fliplearn.currentUser';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly tokenState = signal<string | null>(
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );

  private readonly userState = signal<CurrentUserResponse | null>(
    this.loadStoredUser(),
  );

  readonly accessToken = this.tokenState.asReadonly();
  readonly currentUser = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.tokenState()));

  constructor(private readonly http: HttpClient) {}

  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(
      `${API_BASE_URL}/auth/register`,
      request,
    );
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/auth/login`, request)
      .pipe(
        tap((response) => {
          this.storeLogin(response);
        }),
      );
  }

  googleLogin(request: GoogleLoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/auth/google`, request)
      .pipe(
        tap((response) => {
          this.storeLogin(response);
        }),
      );
  }

  loadCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${API_BASE_URL}/users/me`).pipe(
      tap((user) => {
        this.userState.set(user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    this.tokenState.set(null);
    this.userState.set(null);
  }

  getProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${API_BASE_URL}/users/profile`);
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/users/password`, request);
  }

  updateProfile(
    request: UpdateProfileRequest,
  ): Observable<CurrentUserResponse> {
    return this.http.put<CurrentUserResponse>(
      `${API_BASE_URL}/users/profile`,
      request,
    );
  }

  changeEmail(request: ChangeEmailRequest): Observable<void> {
    return this.http.put<void>(`${API_BASE_URL}/users/email`, request);
  }

  setCurrentUser(user: CurrentUserResponse): void {
    this.userState.set(user);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  private storeLogin(response: LoginResponse): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    this.tokenState.set(response.accessToken);

    const user: CurrentUserResponse = {
      id: response.userId,
      displayName: response.displayName,
      username: response.username,
      email: response.email,
      role: response.role,
      enabled: true,
      createdAt: '',
    };

    this.userState.set(user);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  private loadStoredUser(): CurrentUserResponse | null {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as CurrentUserResponse;
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);

      return null;
    }
  }
}
