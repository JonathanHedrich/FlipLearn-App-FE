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

import { AuthApi } from '../../../core/services/auth-api';
import { AuthStore } from '../../../core/stores/auth.store';
import { FlashcardStore } from '../../../core/stores/flashcard.store';
import { FlBottomNavComponent } from '../../../shared/components/fl-bottom-nav/fl-bottom-nav.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, FlBottomNavComponent],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  /*
   * Profil und Lernsets kommen direkt aus den zentralen Stores.
   * Dadurch speichern wir die Daten nicht noch einmal lokal.
   */
  readonly profile = this.authStore.profile;
  readonly sets = this.flashcardStore.sets;

  readonly isLoading = signal(true);
  readonly loadError = signal('');

  constructor(
    private readonly authApi: AuthApi,
    private readonly authStore: AuthStore,
    private readonly flashcardStore: FlashcardStore,
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
    const name = this.profile()?.displayName.trim();

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

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Unbekannt';
    }

    return new Intl.DateTimeFormat('de-DE', {
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  async loadProfile(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');

    try {
      /*
       * Profil und Sets werden parallel geladen.
       * loadSets() führt nur dann einen neuen Request aus,
       * wenn die Sets noch nicht geladen wurden.
       */
      const [profile] = await Promise.all([
        firstValueFrom(this.authApi.getProfile()),
        this.flashcardStore.loadSets(),
      ]);

      this.authStore.setProfile(profile);
    } catch (error: unknown) {
      this.loadError.set(this.resolveLoadError(error));
    } finally {
      this.isLoading.set(false);
    }
  }

  async reloadProfile(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');

    try {
      const [profile] = await Promise.all([
        firstValueFrom(this.authApi.getProfile()),
        this.flashcardStore.loadSets(true),
      ]);

      this.authStore.setProfile(profile);
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
    if (!(error instanceof HttpErrorResponse)) {
      return 'Das Profil konnte nicht geladen werden.';
    }

    if (error.status === 0) {
      return 'Das Backend ist nicht erreichbar.';
    }

    if (error.status === 401) {
      return 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.';
    }

    if (
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return 'Das Profil konnte nicht geladen werden.';
  }
}
