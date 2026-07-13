import { Injectable, computed, signal } from '@angular/core';

import { LoginResponse, UserProfileResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly currentUserState = signal<LoginResponse | null>(null);

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

  readonly email = computed(
    () => this.currentUserState()?.email ?? this.profileState()?.email ?? '',
  );

  setCurrentUser(user: LoginResponse): void {
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
