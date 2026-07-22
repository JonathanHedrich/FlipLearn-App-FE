import { Injectable } from '@angular/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { firstValueFrom } from 'rxjs';

import { GOOGLE_WEB_CLIENT_ID } from '../config/google-auth.config';
import { CurrentUserResponse, LoginResponse } from '../models/auth.model';
import { AuthStore } from '../stores/auth.store';
import { AuthApi } from './auth-api';

export class GoogleLoginCancelledError extends Error {
  constructor() {
    super('Google-Anmeldung wurde abgebrochen.');
    this.name = 'GoogleLoginCancelledError';
  }
}

export class GoogleIdTokenMissingError extends Error {
  constructor() {
    super('Google hat kein ID-Token zurückgegeben.');
    this.name = 'GoogleIdTokenMissingError';
  }
}

@Injectable({
  providedIn: 'root',
})
export class GoogleAuthService {
  private initializationPromise: Promise<void> | null = null;

  constructor(
    private readonly authApi: AuthApi,
    private readonly authStore: AuthStore,
  ) {}

  initialize(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializePlugin().catch(
        (error: unknown) => {
          this.initializationPromise = null;
          throw error;
        },
      );
    }

    return this.initializationPromise;
  }

  async login(): Promise<CurrentUserResponse> {
    await this.initialize();

    let googleResult: Awaited<ReturnType<typeof SocialLogin.login>>;

    try {
      googleResult = await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: ['email', 'profile'],
        },
      });
    } catch (error: unknown) {
      if (this.isCancellationError(error)) {
        throw new GoogleLoginCancelledError();
      }

      throw error;
    }

    const result = googleResult.result;

    if (!result || typeof result !== 'object' || !('idToken' in result)) {
      throw new GoogleIdTokenMissingError();
    }

    const idToken = result.idToken;

    if (!idToken) {
      throw new GoogleIdTokenMissingError();
    }

    const loginResponse: LoginResponse = await firstValueFrom(
      this.authApi.googleLogin({
        idToken,
      }),
    );

    this.authStore.setCurrentUser(loginResponse);

    const currentUser = await firstValueFrom(this.authApi.loadCurrentUser());

    this.authStore.setCurrentUser(currentUser);

    return currentUser;
  }

  async logout(): Promise<void> {
    try {
      await SocialLogin.logout({
        provider: 'google',
      });
    } finally {
      this.authApi.logout();
      this.authStore.clear();
    }
  }

  private async initializePlugin(): Promise<void> {
    await SocialLogin.initialize({
      google: {
        webClientId: GOOGLE_WEB_CLIENT_ID,
        mode: 'online',
      },
    });
  }

  private isCancellationError(error: unknown): boolean {
    const message = this.getErrorMessage(error).toUpperCase();

    return (
      message.includes('USER_CANCELLED') ||
      message.includes('CANCELLED') ||
      message.includes('CANCELED') ||
      message.includes('ABORT')
    );
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return error.message;
    }

    return '';
  }
}
