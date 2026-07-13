import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  chevronForwardOutline,
  notificationsOutline,
  settingsOutline,
  starOutline,
  trophyOutline,
} from 'ionicons/icons';

import { UserProfileResponse } from '../../../core/models/auth.model';
import { FlashcardSetResponse } from '../../../core/models/flashcard-api.model';
import { AuthApi } from '../../../core/services/auth-api';
import { FlashcardApi } from '../../../core/services/flashcard-api';
import { FlBottomNavComponent } from '../../../shared/components/fl-bottom-nav/fl-bottom-nav.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, FlBottomNavComponent],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  readonly profile = signal<UserProfileResponse | null>(null);
  readonly sets = signal<FlashcardSetResponse[]>([]);

  readonly isLoading = signal(true);
  readonly loadError = signal('');

  constructor(
    private readonly authApi: AuthApi,
    private readonly flashcardApi: FlashcardApi,
    private readonly router: Router,
  ) {
    addIcons({
      bookOutline,
      chevronForwardOutline,
      notificationsOutline,
      settingsOutline,
      starOutline,
      trophyOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.loadProfile();
  }

  get initials(): string {
    const name = this.profile()?.displayName?.trim();

    if (!name) {
      return 'FL';
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  get memberSince(): string {
    const value = this.profile()?.memberSince;

    if (!value) {
      return 'Unbekannt';
    }

    return new Intl.DateTimeFormat('de-DE', {
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  }

  async loadProfile(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');

    try {
      const [profile, sets] = await Promise.all([
        firstValueFrom(this.authApi.getProfile()),
        firstValueFrom(this.flashcardApi.getSets()),
      ]);

      this.profile.set(profile);
      this.sets.set(sets);
    } catch (error: unknown) {
      this.loadError.set(this.resolveLoadError(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  openSettings(): void {
    void this.router.navigateByUrl('/settings');
  }

  openSet(setId: number): void {
    void this.router.navigate(['/sets', setId, 'edit']);
  }

  private resolveLoadError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Das Backend ist nicht erreichbar.';
    }

    return 'Das Profil konnte nicht geladen werden.';
  }
}
