import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonToggle } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  chevronForwardOutline,
  logOutOutline,
  personOutline,
  radioButtonOnOutline,
} from 'ionicons/icons';

import {
  AppLanguage,
  LanguageService,
} from '../../../core/services/language.service';
import { AppNotificationService } from '../../../core/services/app-notification.service';
import { AuthApi } from '../../../core/services/auth-api';
import { NotificationService } from '../../../core/services/notification.service';
import { StreakAlertService } from '../../../core/services/streak-alert.service';
import { AppTheme, ThemeService } from '../../../core/services/theme.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { FlashcardStore } from '../../../core/stores/flashcard.store';
import { StatisticsStore } from '../../../core/stores/statistics.store';

interface SettingsRow {
  labelKey: string;
  icon: string;
  action: 'goal';
}

interface LanguageOption {
  value: AppLanguage;
  labelKey: string;
  descriptionKey: string;
}

type StudyGoal = number;

const MIN_STUDY_GOAL = 1;
const MAX_STUDY_GOAL = 999;

const STUDY_GOAL_STORAGE_KEY = 'fliplearn.studyGoal';
const STUDY_REMINDERS_STORAGE_KEY = 'fliplearn.studyRemindersEnabled';
const STREAK_ALERTS_STORAGE_KEY = 'fliplearn.streakAlertsEnabled';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, IonContent, IonIcon, IonToggle, TranslatePipe],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  readonly studyPreferences: SettingsRow[] = [
    {
      labelKey: 'settings.study.goalTitle',
      icon: 'radio-button-on-outline',
      action: 'goal',
    },
  ];

  readonly languageOptions: LanguageOption[] = [
    {
      value: 'de',
      labelKey: 'settings.language.german',
      descriptionKey: 'settings.language.germanDescription',
    },
    {
      value: 'en',
      labelKey: 'settings.language.english',
      descriptionKey: 'settings.language.englishDescription',
    },
  ];

  readonly availableStudyGoals: StudyGoal[] = [10, 20, 30, 50, 100, 500];

  selectedStudyGoal: StudyGoal = this.loadStudyGoal();

  customStudyGoal: number | null = null;
  customStudyGoalError = '';

  studyGoalMenuOpen = false;

  notificationPermissionError = '';

  studyRemindersEnabled = this.loadBooleanSetting(
    STUDY_REMINDERS_STORAGE_KEY,
    true,
  );

  streakAlertsEnabled = this.loadBooleanSetting(
    STREAK_ALERTS_STORAGE_KEY,
    true,
  );

  constructor(
    private readonly location: Location,
    private readonly router: Router,
    private readonly authApi: AuthApi,
    private readonly authStore: AuthStore,
    private readonly flashcardStore: FlashcardStore,
    private readonly statisticsStore: StatisticsStore,
    private readonly notificationService: NotificationService,
    readonly themeService: ThemeService,
    readonly languageService: LanguageService,
    private readonly appNotificationService: AppNotificationService,
    private readonly streakAlertService: StreakAlertService,
    private readonly translate: TranslateService,
  ) {
    addIcons({
      arrowBackOutline,
      chevronForwardOutline,
      logOutOutline,
      personOutline,
      radioButtonOnOutline,
    });
  }

  get userName(): string {
    return (
      this.authStore.currentUser()?.displayName ??
      this.authStore.profile()?.displayName ??
      this.translate.instant('settings.profile.defaultUser')
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

  get currentLanguage(): AppLanguage {
    const language = this.languageService.currentLanguage();

    return language === 'en' ? 'en' : 'de';
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
    if (action === 'goal') {
      this.studyGoalMenuOpen = true;
    }
  }

  changeTheme(value: string): void {
    if (value !== 'light' && value !== 'dark' && value !== 'system') {
      return;
    }

    this.themeService.setTheme(value as AppTheme);
  }

  async changeLanguage(value: string): Promise<void> {
    if (!this.languageService.isSupportedLanguage(value)) {
      return;
    }

    await this.languageService.setLanguage(value);

    /*
     * Später kann hier zusätzlich ein Backend-Request erfolgen,
     * beispielsweise:
     *
     * await this.profileApi.updateLanguage({
     *   language: value,
     * });
     */
  }

  logout(): void {
    const confirmed = window.confirm(
      this.translate.instant('settings.confirmations.logout'),
    );

    if (!confirmed) {
      return;
    }

    this.authApi.logout();
    this.authStore.clear();
    this.flashcardStore.clear();
    this.statisticsStore.clear();
    this.appNotificationService.clear();

    void this.router.navigateByUrl('/login', {
      replaceUrl: true,
    });
  }

  selectStudyGoal(goal: StudyGoal): void {
    this.saveStudyGoal(goal);
    this.studyGoalMenuOpen = false;
  }

  saveCustomStudyGoal(): void {
    this.customStudyGoalError = '';

    const goal = Number(this.customStudyGoal);

    if (
      !Number.isInteger(goal) ||
      goal < MIN_STUDY_GOAL ||
      goal > MAX_STUDY_GOAL
    ) {
      this.customStudyGoalError = this.translate.instant(
        'settings.study.customValidation',
        {
          min: MIN_STUDY_GOAL,
          max: MAX_STUDY_GOAL,
        },
      );

      return;
    }

    this.saveStudyGoal(goal);
    this.customStudyGoal = null;
    this.studyGoalMenuOpen = false;
  }

  closeStudyGoalMenu(): void {
    this.studyGoalMenuOpen = false;
  }

  async saveStudyReminders(): Promise<void> {
    this.notificationPermissionError = '';

    if (this.studyRemindersEnabled) {
      const permission = await this.notificationService.requestPermission();

      if (permission !== 'granted') {
        this.studyRemindersEnabled = false;

        this.notificationPermissionError = this.translate.instant(
          'settings.notifications.permissionDenied',
        );
      }
    }

    localStorage.setItem(
      STUDY_REMINDERS_STORAGE_KEY,
      String(this.studyRemindersEnabled),
    );
  }

  async saveStreakAlerts(): Promise<void> {
    this.notificationPermissionError = '';

    if (this.streakAlertsEnabled) {
      const permission = await this.notificationService.requestPermission();

      if (permission !== 'granted') {
        this.streakAlertsEnabled = false;

        this.notificationPermissionError = this.translate.instant(
          'settings.notifications.permissionDenied',
        );
      }
    }

    localStorage.setItem(
      STREAK_ALERTS_STORAGE_KEY,
      String(this.streakAlertsEnabled),
    );

    if (this.streakAlertsEnabled) {
      void this.streakAlertService.checkAndNotify();
    } else {
      this.streakAlertService.clearLastAlert();
    }
  }

  sendTestNotification(): void {
    this.notificationService.show(
      this.translate.instant('settings.notifications.testTitle'),
      {
        body: this.translate.instant('settings.notifications.testBody'),
        icon: '/assets/icon/favicon.png',
      },
    );
  }

  private saveStudyGoal(goal: StudyGoal): void {
    this.selectedStudyGoal = goal;

    localStorage.setItem(STUDY_GOAL_STORAGE_KEY, String(goal));

    this.appNotificationService.rebuildNotifications();
  }

  private loadStudyGoal(): StudyGoal {
    const value = Number(localStorage.getItem(STUDY_GOAL_STORAGE_KEY));

    if (
      Number.isInteger(value) &&
      value >= MIN_STUDY_GOAL &&
      value <= MAX_STUDY_GOAL
    ) {
      return value;
    }

    return 30;
  }

  private loadBooleanSetting(key: string, fallback: boolean): boolean {
    const storedValue = localStorage.getItem(key);

    if (storedValue === 'true') {
      return true;
    }

    if (storedValue === 'false') {
      return false;
    }

    return fallback;
  }
}
