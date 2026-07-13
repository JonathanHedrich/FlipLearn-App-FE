import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  bookOutline,
  flameOutline,
  notificationsOutline,
  settingsOutline,
  trophyOutline,
} from 'ionicons/icons';

import {
  FlashcardSetColor,
  FlashcardSetResponse,
} from '../../../core/models/flashcard-api.model';
import { AuthApi } from '../../../core/services/auth-api';
import { FlashcardStore } from '../../../core/stores/flashcard.store';
import { FlBottomNavComponent } from '../../../shared/components/fl-bottom-nav/fl-bottom-nav.component';
import { AuthStore } from 'src/app/core/stores/auth.store';
import { StatisticsStore } from 'src/app/core/stores/statistics.store';

interface RecentActivity {
  id: number;
  title: string;
  description: string;
  result: string;
  color: FlashcardSetColor;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonIcon,
    FlBottomNavComponent,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  readonly sets = this.flashcardStore.sets;

  readonly isLoading = this.flashcardStore.isLoadingSets;

  readonly loadError = this.flashcardStore.error;

  readonly totalCards = this.flashcardStore.totalCards;

  readonly recentSets = computed(() =>
    [...this.sets()]
      .sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime(),
      )
      .slice(0, 3),
  );

  readonly learnedCards = computed(() =>
    this.sets().reduce(
      (total, set) => total + Math.round(set.cardCount * (set.progress / 100)),
      0,
    ),
  );

  readonly averageAccuracy = computed(() => {
    const setsWithCards = this.sets().filter((set) => set.cardCount > 0);

    if (setsWithCards.length === 0) {
      return 0;
    }

    const totalProgress = setsWithCards.reduce(
      (total, set) => total + set.progress,
      0,
    );

    return Math.round(totalProgress / setsWithCards.length);
  });

  readonly recentActivities = computed<RecentActivity[]>(() =>
    this.recentSets()
      .filter((set) => set.cardCount > 0)
      .slice(0, 2)
      .map((set) => ({
        id: set.id,
        title: set.title,
        description:
          `${set.cardCount} cards · ` + this.formatUpdatedAt(set.updatedAt),
        result: `${set.progress}%`,
        color: set.color,
      })),
  );

  readonly reviewsToday = this.statisticsStore.reviewsToday;

  constructor(
    readonly authApi: AuthApi,
    readonly flashcardStore: FlashcardStore,
    private readonly router: Router,
    private readonly authStore: AuthStore,
    private readonly statisticsStore: StatisticsStore,
  ) {
    addIcons({
      barChartOutline,
      bookOutline,
      flameOutline,
      notificationsOutline,
      settingsOutline,
      trophyOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.loadDashboard();
  }

  get userName(): string {
    return this.authStore.displayName() || 'FlipLearn User';
  }

  get goalProgress(): number {
    return Math.min(this.reviewsToday(), this.dailyStudyGoal);
  }

  get goalPercentage(): number {
    if (this.dailyStudyGoal <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(0, Math.round((this.goalProgress / this.dailyStudyGoal) * 100)),
    );
  }

  async loadDashboard(): Promise<void> {
    try {
      await this.flashcardStore.loadSets();
    } catch {
      // Die Fehlermeldung liegt bereits im Store.
    }
  }

  async reloadDashboard(): Promise<void> {
    try {
      await this.flashcardStore.loadSets(true);
    } catch {
      // Die Fehlermeldung liegt bereits im Store.
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

  getThemeClass(color: FlashcardSetColor): string {
    return `theme-${color}`;
  }

  getCardLabel(set: FlashcardSetResponse): string {
    return set.cardCount === 1 ? '1 card' : `${set.cardCount} cards`;
  }

  private formatUpdatedAt(value: string): string {
    const updatedAt = new Date(value);

    const difference = Date.now() - updatedAt.getTime();

    const minutes = Math.floor(difference / 60_000);

    if (minutes < 1) {
      return 'just now';
    }

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days}d ago`;
  }

  get dailyStudyGoal(): number {
    const storedGoal = Number(localStorage.getItem('fliplearn.studyGoal'));

    return storedGoal > 0 ? storedGoal : 30;
  }
}
