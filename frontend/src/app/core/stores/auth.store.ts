import { Injectable, computed, signal } from '@angular/core';

import {
  CurrentUserResponse,
  LoginResponse,
  UserProfileResponse,
} from '../models/auth.model';

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

  setCurrentUser(user: AuthUser): void {
    this.currentUserState.set(user);
  }

  setProfile(profile: UserProfileResponse): void {
    this.profileState.set(profile);
  }

  clear(): void {
    this.currentUserState.set(null);
    this.profileState.set(null);
  }
}
