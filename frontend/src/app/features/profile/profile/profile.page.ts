import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
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
import { AppNotificationService } from '../../../core/services/app-notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    FlBottomNavComponent,
    TranslatePipe,
  ],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  readonly profile = this.authStore.profile;
  readonly sets = this.flashcardStore.sets;

  readonly isLoading = signal(true);
  readonly loadError = signal('');

  readonly unreadNotifications = this.appNotificationService.unreadCount;

  constructor(
    private readonly authApi: AuthApi,
    private readonly authStore: AuthStore,
    private readonly flashcardStore: FlashcardStore,
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly appNotificationService: AppNotificationService,
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
      return this.translate.instant('profile.memberSinceUnknown');
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return this.translate.instant('profile.memberSinceUnknown');
    }

    const language =
      this.translate.currentLang() ?? this.translate.getFallbackLang() ?? 'de';

    const locale = language === 'en' ? 'en-US' : 'de-DE';

    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  async loadProfile(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');

    try {
      const [profile] = await Promise.all([
        firstValueFrom(this.authApi.getProfile()),
        this.flashcardStore.loadSets(),
      ]);

      this.authStore.setProfile(profile);

      this.appNotificationService.rebuildNotifications();
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
      this.appNotificationService.rebuildNotifications();
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
      return this.translate.instant('profile.error.generic');
    }

    if (error.status === 0) {
      return this.translate.instant('profile.error.backendUnavailable');
    }

    if (error.status === 401) {
      return this.translate.instant('profile.error.sessionExpired');
    }

    if (
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return this.translate.instant('profile.error.generic');
  }
}
