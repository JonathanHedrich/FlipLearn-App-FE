import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonToggle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  chevronForwardOutline,
  logOutOutline,
  personOutline,
  radioButtonOnOutline,
} from 'ionicons/icons';

import { AuthApi } from '../../../core/services/auth-api';
import { AppTheme, ThemeService } from '../../../core/services/theme.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { FlashcardStore } from '../../../core/stores/flashcard.store';
import { StatisticsStore } from '../../../core/stores/statistics.store';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotificationService } from '../../../core/services/app-notification.service';

interface SettingsRow {
  label: string;
  icon: string;
  action: 'goal';
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
  imports: [FormsModule, IonContent, IonIcon, IonToggle],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  readonly studyPreferences: SettingsRow[] = [
    {
      label: 'Daily Study Goal',
      icon: 'radio-button-on-outline',
      action: 'goal',
    },
  ];

  readonly availableStudyGoals: StudyGoal[] = [10, 20, 30, 50, 100, 500];

  selectedStudyGoal: StudyGoal = this.loadStudyGoal();

  customStudyGoal: number | null = null;
  customStudyGoalError = '';

  studyGoalMenuOpen = false;

  notificationPermissionError = '';

  constructor(
    private readonly location: Location,
    private readonly router: Router,
    private readonly authApi: AuthApi,
    private readonly authStore: AuthStore,
    private readonly flashcardStore: FlashcardStore,
    private readonly statisticsStore: StatisticsStore,
    private readonly notificationService: NotificationService,
    readonly themeService: ThemeService,
    private readonly appNotificationService: AppNotificationService,
  ) {
    addIcons({
      arrowBackOutline,
      chevronForwardOutline,
      logOutOutline,
      personOutline,
      radioButtonOnOutline,
    });
  }

  studyRemindersEnabled = this.loadBooleanSetting(
    STUDY_REMINDERS_STORAGE_KEY,
    true,
  );

  streakAlertsEnabled = this.loadBooleanSetting(
    STREAK_ALERTS_STORAGE_KEY,
    true,
  );

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

  logout(): void {
    const confirmed = window.confirm('Möchtest du dich wirklich abmelden?');

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
      this.customStudyGoalError = `Das Ziel muss eine ganze Zahl zwischen ${MIN_STUDY_GOAL} und ${MAX_STUDY_GOAL} sein.`;

      return;
    }

    this.saveStudyGoal(goal);
    this.customStudyGoal = null;
    this.studyGoalMenuOpen = false;
  }

  private saveStudyGoal(goal: StudyGoal): void {
    this.selectedStudyGoal = goal;

    localStorage.setItem(STUDY_GOAL_STORAGE_KEY, String(goal));

    this.appNotificationService.rebuildNotifications();
  }

  closeStudyGoalMenu(): void {
    this.studyGoalMenuOpen = false;
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

  async saveStudyReminders(): Promise<void> {
    this.notificationPermissionError = '';

    if (this.studyRemindersEnabled) {
      const permission = await this.notificationService.requestPermission();

      if (permission !== 'granted') {
        this.studyRemindersEnabled = false;

        this.notificationPermissionError =
          'Benachrichtigungen wurden vom Browser nicht erlaubt.';
      }
    }

    localStorage.setItem(
      STUDY_REMINDERS_STORAGE_KEY,
      String(this.studyRemindersEnabled),
    );
  }

  saveStreakAlerts(): void {
    localStorage.setItem(
      STREAK_ALERTS_STORAGE_KEY,
      String(this.streakAlertsEnabled),
    );
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

  sendTestNotification(): void {
    this.notificationService.show('FlipLearn', {
      body: 'Zeit für deine tägliche Lernsitzung 📚',
      icon: '/assets/icon/favicon.png',
    });
  }
}
