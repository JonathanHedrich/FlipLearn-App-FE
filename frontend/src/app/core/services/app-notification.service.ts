import { Injectable, computed, signal } from '@angular/core';

import { AppNotification } from '../models/app-notification.model';
import { FlashcardStore } from '../stores/flashcard.store';
import { StatisticsStore } from '../stores/statistics.store';
import { TranslateService } from '@ngx-translate/core';

const STUDY_GOAL_STORAGE_KEY = 'fliplearn.studyGoal';

const READ_NOTIFICATIONS_STORAGE_KEY = 'fliplearn.readNotifications';

const DISMISSED_NOTIFICATIONS_STORAGE_KEY = 'fliplearn.dismissedNotifications';

@Injectable({
  providedIn: 'root',
})
export class AppNotificationService {
  private readonly notificationsState = signal<AppNotification[]>([]);

  private readonly readNotificationIdsState = signal<Set<string>>(
    this.loadReadNotificationIds(),
  );

  readonly notifications = this.notificationsState.asReadonly();

  readonly unreadCount = computed(
    () =>
      this.notificationsState().filter((notification) => !notification.read)
        .length,
  );

  private readonly dismissedNotificationIdsState = signal<Set<string>>(
    this.loadDismissedNotificationIds(),
  );

  constructor(
    private readonly flashcardStore: FlashcardStore,
    private readonly statisticsStore: StatisticsStore,
    private readonly translate: TranslateService,
  ) {}

  rebuildNotifications(): void {
    const notifications: AppNotification[] = [];
    const activeNotificationIds: string[] = [];

    const now = new Date();
    const todayKey = this.getTodayKey();

    const reviewsToday = this.statisticsStore.reviewsToday();

    const goal = this.loadDailyStudyGoal();

    const remaining = Math.max(0, goal - reviewsToday);

    if (remaining === 0) {
      const notificationId = `daily-goal-complete-${todayKey}`;

      activeNotificationIds.push(notificationId);

      this.addNotification(notifications, {
        id: notificationId,
        type: 'goal',
        title: 'Tagesziel erreicht',
        message:
          'Starke Leistung – du hast dein heutiges Lernziel vollständig erreicht.',
        icon: 'checkmark-circle-outline',
        createdAt: now,
        route: '/statistics',
      });
    } else {
      const notificationId = `daily-goal-open-${todayKey}`;

      activeNotificationIds.push(notificationId);

      this.addNotification(notifications, {
        id: notificationId,
        type: 'goal',
        title: 'Tagesziel noch offen',
        message: `Noch ${remaining} Karten bis zu deinem Tagesziel.`,
        icon: 'radio-button-on-outline',
        createdAt: now,
        route: '/sets',
      });
    }

    const streak = this.statisticsStore.currentStreak();

    if (streak > 0) {
      const notificationId = `active-streak-${todayKey}-${streak}`;

      activeNotificationIds.push(notificationId);

      this.addNotification(notifications, {
        id: notificationId,
        type: 'streak',
        title: `${streak} Day Streak`,
        message: 'Lerne heute weiter, damit deine Serie bestehen bleibt.',
        icon: 'flame-outline',
        createdAt: now,
        route: '/statistics',
      });
    }

    const earnedAchievements = this.statisticsStore
      .achievements()
      .filter((achievement) => achievement.earned)
      .slice(0, 3);

    for (const achievement of earnedAchievements) {
      const notificationId = `achievement-${achievement.code}`;

      activeNotificationIds.push(notificationId);

      this.addNotification(notifications, {
        id: notificationId,
        type: 'achievement',
        title: this.translate.instant(
          `achievements.${achievement.code}.title`,
          achievement.params,
        ),
        message: this.translate.instant(
          `achievements.${achievement.code}.description`,
          achievement.params,
        ),
        icon: 'trophy-outline',
        createdAt: now,
        route: '/statistics',
      });
    }

    const emptySets = this.flashcardStore
      .sets()
      .filter((set) => set.cardCount === 0)
      .slice(0, 2);

    for (const set of emptySets) {
      const notificationId = `empty-set-${set.id}`;

      activeNotificationIds.push(notificationId);

      this.addNotification(notifications, {
        id: notificationId,
        type: 'warning',
        title: 'Lernset ohne Karten',
        message: `„${set.title}“ enthält noch keine Lernkarten.`,
        icon: 'alert-circle-outline',
        createdAt: now,
        route: `/sets/${set.id}/edit`,
      });
    }

    this.cleanupDismissedNotificationIds(activeNotificationIds);

    this.notificationsState.set(notifications);
  }

  markAsRead(notificationId: string): void {
    this.readNotificationIdsState.update((ids) => {
      const updatedIds = new Set(ids);

      updatedIds.add(notificationId);

      return updatedIds;
    });

    this.saveReadNotificationIds();

    this.notificationsState.update((notifications) =>
      notifications.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    );
  }

  markAllAsRead(): void {
    const updatedIds = new Set(
      this.notificationsState().map((notification) => notification.id),
    );

    this.readNotificationIdsState.set(updatedIds);

    this.saveReadNotificationIds();

    this.notificationsState.update((notifications) =>
      notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    );
  }

  clear(): void {
    this.notificationsState.set([]);

    this.readNotificationIdsState.set(new Set<string>());

    this.dismissedNotificationIdsState.set(new Set<string>());

    localStorage.removeItem(READ_NOTIFICATIONS_STORAGE_KEY);

    localStorage.removeItem(DISMISSED_NOTIFICATIONS_STORAGE_KEY);
  }

  private createNotification(
    notification: Omit<AppNotification, 'read'>,
  ): AppNotification | null {
    if (this.dismissedNotificationIdsState().has(notification.id)) {
      return null;
    }

    return {
      ...notification,
      read: this.readNotificationIdsState().has(notification.id),
    };
  }

  private loadReadNotificationIds(): Set<string> {
    const storedValue = localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);

    if (!storedValue) {
      return new Set<string>();
    }

    try {
      const ids = JSON.parse(storedValue);

      if (!Array.isArray(ids)) {
        return new Set<string>();
      }

      return new Set(ids.filter((id): id is string => typeof id === 'string'));
    } catch {
      localStorage.removeItem(READ_NOTIFICATIONS_STORAGE_KEY);

      return new Set<string>();
    }
  }

  private saveReadNotificationIds(): void {
    localStorage.setItem(
      READ_NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(Array.from(this.readNotificationIdsState())),
    );
  }

  private loadDailyStudyGoal(): number {
    const storedGoal = Number(localStorage.getItem(STUDY_GOAL_STORAGE_KEY));

    if (Number.isInteger(storedGoal) && storedGoal > 0) {
      return storedGoal;
    }

    return 30;
  }

  removeNotification(notificationId: string): void {
    this.dismissedNotificationIdsState.update((ids) => {
      const updatedIds = new Set(ids);

      updatedIds.add(notificationId);

      return updatedIds;
    });

    this.saveDismissedNotificationIds();

    this.notificationsState.update((notifications) =>
      notifications.filter(
        (notification) => notification.id !== notificationId,
      ),
    );
  }

  removeAllNotifications(): void {
    const currentIds = this.notificationsState().map(
      (notification) => notification.id,
    );

    this.dismissedNotificationIdsState.update((ids) => {
      const updatedIds = new Set(ids);

      for (const id of currentIds) {
        updatedIds.add(id);
      }

      return updatedIds;
    });

    this.saveDismissedNotificationIds();

    this.notificationsState.set([]);
  }

  private addNotification(
    notifications: AppNotification[],
    notification: Omit<AppNotification, 'read'>,
  ): void {
    const created = this.createNotification(notification);

    if (created) {
      notifications.push(created);
    }
  }

  private loadDismissedNotificationIds(): Set<string> {
    const storedValue = localStorage.getItem(
      DISMISSED_NOTIFICATIONS_STORAGE_KEY,
    );

    if (!storedValue) {
      return new Set<string>();
    }

    try {
      const ids = JSON.parse(storedValue);

      if (!Array.isArray(ids)) {
        return new Set<string>();
      }

      return new Set(ids.filter((id): id is string => typeof id === 'string'));
    } catch {
      localStorage.removeItem(DISMISSED_NOTIFICATIONS_STORAGE_KEY);

      return new Set<string>();
    }
  }

  private saveDismissedNotificationIds(): void {
    localStorage.setItem(
      DISMISSED_NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(Array.from(this.dismissedNotificationIdsState())),
    );
  }

  private getTodayKey(): string {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  private cleanupDismissedNotificationIds(
    activeNotificationIds: string[],
  ): void {
    const activeIds = new Set(activeNotificationIds);

    this.dismissedNotificationIdsState.update((ids) => {
      const cleanedIds = new Set<string>();

      for (const id of ids) {
        const isPersistentAchievement = id.startsWith('achievement-');

        const isStillActive = activeIds.has(id);

        if (isPersistentAchievement || isStillActive) {
          cleanedIds.add(id);
        }
      }

      return cleanedIds;
    });

    this.saveDismissedNotificationIds();
  }
}
