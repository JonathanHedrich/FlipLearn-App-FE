import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonToggle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  chevronForwardOutline,
  layersOutline,
  logOutOutline,
  personOutline,
  radioButtonOnOutline,
} from 'ionicons/icons';

import { AuthApi } from '../../../core/services/auth-api';
import { AppTheme, ThemeService } from '../../../core/services/theme.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { FlashcardStore } from '../../../core/stores/flashcard.store';
import { StatisticsStore } from '../../../core/stores/statistics.store';

interface SettingsRow {
  label: string;
  value?: string;
  icon: string;
  action: 'goal' | 'order';
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, IonContent, IonIcon, IonToggle],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  studyRemindersEnabled = true;
  streakAlertsEnabled = true;

  readonly studyPreferences: SettingsRow[] = [
    {
      label: 'Daily Study Goal',
      value: '30 cards',
      icon: 'radio-button-on-outline',
      action: 'goal',
    },
    {
      label: 'Card Order',
      value: 'Random',
      icon: 'layers-outline',
      action: 'order',
    },
  ];

  constructor(
    private readonly location: Location,
    private readonly router: Router,
    private readonly authApi: AuthApi,
    private readonly authStore: AuthStore,
    private readonly flashcardStore: FlashcardStore,
    private readonly statisticsStore: StatisticsStore,
    readonly themeService: ThemeService,
  ) {
    addIcons({
      arrowBackOutline,
      chevronForwardOutline,
      layersOutline,
      logOutOutline,
      personOutline,
      radioButtonOnOutline,
    });
  }

  get userName(): string {
    return (
      this.authStore.currentUser()?.displayName ??
      this.authStore.profile()?.displayName ??
      'FlipLearn User'
    );
  }

  get userEmail(): string {
    return (
      this.authStore.currentUser()?.email ??
      this.authStore.profile()?.email ??
      ''
    );
  }

  get userInitials(): string {
    const name = this.userName.trim();

    if (!name) {
      return 'FL';
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/profile');
  }

  editProfile(): void {
    void this.router.navigateByUrl('/profile/edit');
  }

  openSetting(action: SettingsRow['action']): void {
    console.log('Einstellung öffnen:', action);
  }

  changeTheme(value: string): void {
    if (value !== 'light' && value !== 'dark' && value !== 'system') {
      return;
    }

    this.themeService.setTheme(value as AppTheme);
  }

  logout(): void {
    const confirmed = window.confirm('Möchtest du dich wirklich abmelden?');

    if (!confirmed) {
      return;
    }

    this.authApi.logout();
    this.authStore.clear();
    this.flashcardStore.clear();
    this.statisticsStore.clear();

    void this.router.navigateByUrl('/login', {
      replaceUrl: true,
    });
  }
}
