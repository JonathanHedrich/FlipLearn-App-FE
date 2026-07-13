import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
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
import { FlashcardApi } from '../../../core/services/flashcard-api';
import { FlBottomNavComponent } from '../../../shared/components/fl-bottom-nav/fl-bottom-nav.component';

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
    DecimalPipe,
    RouterLink,
    IonContent,
    IonIcon,
    FlBottomNavComponent,
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  readonly sets = signal<FlashcardSetResponse[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal('');

  readonly recentSets = computed(() =>
    [...this.sets()]
      .sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime(),
      )
      .slice(0, 3),
  );

  readonly totalCards = computed(() =>
    this.sets().reduce((total, set) => total + set.cardCount, 0),
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

  constructor(
    readonly authApi: AuthApi,
    private readonly flashcardApi: FlashcardApi,
    private readonly router: Router,
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
    return this.authApi.currentUser()?.displayName ?? 'FlipLearn User';
  }

  get goalProgress(): number {
    return Math.min(this.learnedCards(), 30);
  }

  get goalPercentage(): number {
    return Math.round((this.goalProgress / 30) * 100);
  }

  async loadDashboard(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');

    try {
      const sets = await firstValueFrom(this.flashcardApi.getSets());

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

  private resolveLoadError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Das Backend ist nicht erreichbar.';
    }

    return 'Die Dashboard-Daten konnten nicht geladen werden.';
  }
}
