import { Injectable, OnDestroy } from '@angular/core';

import { NotificationService } from './notification.service';
import { StatisticsStore } from '../stores/statistics.store';

const STREAK_ALERTS_STORAGE_KEY = 'fliplearn.streakAlertsEnabled';

const LAST_STREAK_ALERT_STORAGE_KEY = 'fliplearn.lastStreakAlertDate';

/*
 * Erst ab 18 Uhr soll vor einer möglicherweise
 * verlorenen Serie gewarnt werden.
 */
const STREAK_ALERT_HOUR = 18;

@Injectable({
  providedIn: 'root',
})
export class StreakAlertService implements OnDestroy {
  private isChecking = false;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly statisticsStore: StatisticsStore,
  ) {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  ngOnDestroy(): void {
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
    );
  }

  async checkAndNotify(): Promise<void> {
    if (this.isChecking || !this.areStreakAlertsEnabled()) {
      return;
    }

    this.isChecking = true;

    try {
      await this.statisticsStore.loadOverview(true);

      const currentStreak = this.statisticsStore.currentStreak();

      const reviewsToday = this.statisticsStore.reviewsToday();

      /*
       * Keine aktive Serie oder heute bereits
       * gelernt: Es besteht keine Gefahr.
       */
      if (currentStreak <= 0 || reviewsToday > 0) {
        return;
      }

      const now = new Date();

      /*
       * Nicht bereits morgens warnen.
       */
      if (now.getHours() < STREAK_ALERT_HOUR) {
        return;
      }

      const todayKey = this.getLocalDateKey(now);

      if (this.wasAlertAlreadySent(todayKey)) {
        return;
      }

      const permission = await this.notificationService.requestPermission();

      if (permission !== 'granted') {
        return;
      }

      this.notificationService.show('Deine Lernserie ist in Gefahr 🔥', {
        body:
          `Du hast eine ${currentStreak}-Tage-Serie. ` +
          'Lerne heute noch mindestens eine Karte, damit sie bestehen bleibt.',
        icon: '/assets/icon/favicon.png',
        tag: `streak-alert-${todayKey}`,
      });

      localStorage.setItem(LAST_STREAK_ALERT_STORAGE_KEY, todayKey);
    } catch {
      /*
       * Ein fehlgeschlagener Hintergrundcheck
       * soll die App nicht blockieren.
       */
    } finally {
      this.isChecking = false;
    }
  }

  clearLastAlert(): void {
    localStorage.removeItem(LAST_STREAK_ALERT_STORAGE_KEY);
  }

  private areStreakAlertsEnabled(): boolean {
    return localStorage.getItem(STREAK_ALERTS_STORAGE_KEY) === 'true';
  }

  private wasAlertAlreadySent(todayKey: string): boolean {
    return localStorage.getItem(LAST_STREAK_ALERT_STORAGE_KEY) === todayKey;
  }

  private getLocalDateKey(date: Date): string {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      void this.checkAndNotify();
    }
  };
}
