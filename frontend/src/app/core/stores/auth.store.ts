import { Injectable, computed, signal } from '@angular/core';

import {
  CurrentUserResponse,
  LoginResponse,
  UserProfileResponse,
} from '../models/auth.model';
import { AuthApi } from '../services/auth-api';

export type AuthUser = LoginResponse | CurrentUserResponse;

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly currentUserState = signal<AuthUser | null>(null);

  private readonly profileState = signal<UserProfileResponse | null>(null);

  readonly currentUser = this.currentUserState.asReadonly();

  readonly profile = this.profileState.asReadonly();

  readonly isLoggedIn = computed(() => this.currentUserState() !== null);

  readonly displayName = computed(
    () =>
      this.currentUserState()?.displayName ??
      this.profileState()?.displayName ??
      '',
  );

  readonly username = computed(() => this.currentUserState()?.username ?? '');

  readonly email = computed(
    () => this.currentUserState()?.email ?? this.profileState()?.email ?? '',
  );

  constructor(private readonly authApi: AuthApi) {
    this.restoreCurrentUser();
  }

  setCurrentUser(user: AuthUser): void {
    this.currentUserState.set(user);
  }

  setProfile(profile: UserProfileResponse): void {
    this.profileState.set(profile);
  }

  updateProfileData(user: CurrentUserResponse): void {
    this.currentUserState.set(user);

    const currentProfile = this.profileState();

    if (!currentProfile) {
      return;
    }

    this.profileState.set({
      ...currentProfile,
      displayName: user.displayName,
      email: user.email,
    });
  }

  clear(): void {
    this.currentUserState.set(null);
    this.profileState.set(null);
  }

  private restoreCurrentUser(): void {
    const storedUser = this.authApi.currentUser();

    if (storedUser) {
      this.currentUserState.set(storedUser);
    }
  }
}
