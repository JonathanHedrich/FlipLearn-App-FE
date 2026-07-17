import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  barChartOutline,
  bookOutline,
  chevronForwardOutline,
  flameOutline,
  notificationsOutline,
  playOutline,
  settingsOutline,
  sparklesOutline,
  timeOutline,
  trophyOutline,
} from 'ionicons/icons';

import { AchievementResponse } from '../../../core/models/statistics-api.model';
import {
  FlashcardSetColor,
  FlashcardSetResponse,
} from '../../../core/models/flashcard-api.model';
import { AuthStore } from '../../../core/stores/auth.store';
import { FlashcardStore } from '../../../core/stores/flashcard.store';
import { StatisticsStore } from '../../../core/stores/statistics.store';
import { FlBottomNavComponent } from '../../../shared/components/fl-bottom-nav/fl-bottom-nav.component';
import { AppNotificationService } from '../../../core/services/app-notification.service';

import { TranslateService, TranslatePipe } from '@ngx-translate/core';

const STUDY_GOAL_STORAGE_KEY = 'fliplearn.studyGoal';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    FlBottomNavComponent,
    TranslatePipe,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  readonly sets = this.flashcardStore.sets;

  readonly isLoading = this.flashcardStore.isLoadingSets;

  readonly loadError = this.flashcardStore.error;

  readonly reviewsToday = this.statisticsStore.reviewsToday;

  readonly todayAccuracy = this.statisticsStore.todayAccuracy;

  readonly weeklyStudyMinutes = this.statisticsStore.weeklyStudyMinutes;

  readonly currentStreak = this.statisticsStore.currentStreak;

  readonly achievements = this.statisticsStore.achievements;

  readonly dailyStudyGoal = signal(this.loadDailyStudyGoal());

  readonly recentSets = computed(() =>
    [...this.sets()]
      .sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime(),
      )
      .slice(0, 3),
  );

  readonly continueStudyingSets = computed(() =>
    [...this.sets()]
      .filter((set) => set.cardCount > 0)
      .sort((first, second) => {
        const firstUnfinished = first.progress < 100 ? 1 : 0;

        const secondUnfinished = second.progress < 100 ? 1 : 0;

        if (firstUnfinished !== secondUnfinished) {
          return secondUnfinished - firstUnfinished;
        }

        return (
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime()
        );
      })
      .slice(0, 3),
  );

  readonly recentAchievements = computed(() =>
    this.achievements()
      .filter((achievement) => achievement.earned)
      .slice(0, 3),
  );

  readonly remainingGoalCards = computed(() =>
    Math.max(0, this.dailyStudyGoal() - this.reviewsToday()),
  );

  readonly goalPercentage = computed(() => {
    const goal = this.dailyStudyGoal();

    if (goal <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(0, Math.round((this.reviewsToday() / goal) * 100)),
    );
  });

  readonly motivationMessage = computed(() => {
    const remaining = this.remainingGoalCards();

    if (remaining === 0) {
      return this.translate.instant('home.motivation.goalReached');
    }

    if (this.reviewsToday() === 0) {
      return this.translate.instant('home.motivation.firstCard');
    }

    if (remaining <= 5) {
      return this.translate.instant('home.motivation.remaining', {
        remaining,
      });
    }

    return this.translate.instant('home.motivation.keepGoing');
  });

  readonly unreadNotifications = this.appNotificationService.unreadCount;

  constructor(
    readonly authStore: AuthStore,
    readonly flashcardStore: FlashcardStore,
    readonly statisticsStore: StatisticsStore,
    private readonly router: Router,
    readonly appNotificationService: AppNotificationService,
    private readonly translate: TranslateService,
  ) {
    addIcons({
      addOutline,
      barChartOutline,
      bookOutline,
      chevronForwardOutline,
      flameOutline,
      notificationsOutline,
      playOutline,
      settingsOutline,
      sparklesOutline,
      timeOutline,
      trophyOutline,
    });
  }

  ionViewWillEnter(): void {
    this.dailyStudyGoal.set(this.loadDailyStudyGoal());

    void this.loadDashboard();
  }

  get displayName(): string {
    return (
      this.authStore.displayName() || this.translate.instant('home.defaultUser')
    );
  }

  get userName(): string {
    return (
      this.authStore.username() || this.translate.instant('home.defaultUser')
    );
  }

  get firstName(): string {
    return (
      this.userName.trim().split(/\s+/)[0] ||
      this.translate.instant('home.defaultLearner')
    );
  }

  get greeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return this.translate.instant('home.greeting.morning');
    }

    if (hour < 18) {
      return this.translate.instant('home.greeting.afternoon');
    }

    return this.translate.instant('home.greeting.evening');
  }

  private loadDailyStudyGoal(): number {
    const storedGoal = Number(localStorage.getItem(STUDY_GOAL_STORAGE_KEY));

    if (Number.isInteger(storedGoal) && storedGoal > 0) {
      return storedGoal;
    }

    return 30;
  }

  get weeklyStudyTimeLabel(): string {
    const totalMinutes = this.weeklyStudyMinutes();

    const hours = Math.floor(totalMinutes / 60);

    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes}m`;
    }

    if (minutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
  }

  async loadDashboard(): Promise<void> {
    try {
      await Promise.all([
        this.flashcardStore.loadSets(true),
        this.statisticsStore.loadOverview(true),
      ]);

      this.appNotificationService.rebuildNotifications();
    } catch {
      // Die Fehler werden bereits in den Stores gespeichert.
    }
  }

  async reloadDashboard(): Promise<void> {
    try {
      await Promise.all([
        this.flashcardStore.loadSets(true),
        this.statisticsStore.loadOverview(true),
      ]);
    } catch {
      // Die Fehler werden bereits in den Stores gespeichert.
    }
  }

  openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  openSettings(): void {
    void this.router.navigateByUrl('/settings');
  }

  openSet(set: FlashcardSetResponse): void {
    if (set.cardCount === 0) {
      void this.router.navigate(['/sets', set.id, 'edit']);

      return;
    }

    void this.router.navigate(['/study', set.id]);
  }

  openSets(): void {
    void this.router.navigateByUrl('/sets');
  }

  openCreateSet(): void {
    void this.router.navigateByUrl('/sets/create');
  }

  openStatistics(): void {
    void this.router.navigateByUrl('/statistics');
  }

  getThemeClass(color: FlashcardSetColor): string {
    return `theme-${color}`;
  }

  getCardLabel(set: FlashcardSetResponse): string {
    return this.translate.instant(
      set.cardCount === 1 ? 'home.cards.single' : 'home.cards.multiple',
      {
        count: set.cardCount,
      },
    );
  }

  getAchievementIcon(achievement: AchievementResponse): string {
    const iconMap: Record<string, string> = {
      trophy: 'trophy-outline',
      flame: 'flame-outline',
      flash: 'sparkles-outline',
      star: 'trophy-outline',
      heart: 'sparkles-outline',
      time: 'time-outline',
      school: 'book-outline',
      brain: 'book-outline',
    };

    return iconMap[achievement.icon] ?? 'trophy-outline';
  }
}
