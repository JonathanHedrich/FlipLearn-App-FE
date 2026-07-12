import { Component, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { DecimalPipe } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  bookOutline,
  flameOutline,
  notificationsOutline,
  settingsOutline,
  timeOutline,
  trophyOutline,
} from 'ionicons/icons';

import {
  FlashcardSet,
  FlashcardSetColor,
} from '../../../core/models/flashcard.model';
import { FlashcardStore } from '../../../core/services/flashcard-store';
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
  imports: [RouterLink, IonContent, IonIcon, FlBottomNavComponent, DecimalPipe],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  readonly userName = 'Alex Johnson';

  readonly recentSets = computed(() =>
    [...this.flashcardStore.sets()]
      .sort(
        (firstSet, secondSet) =>
          new Date(secondSet.updatedAt).getTime() -
          new Date(firstSet.updatedAt).getTime(),
      )
      .slice(0, 3),
  );

  readonly learnedCards = computed(() =>
    this.flashcardStore
      .sets()
      .reduce(
        (total, set) =>
          total + Math.round(set.cards.length * (set.progress / 100)),
        0,
      ),
  );

  readonly averageAccuracy = computed(() => {
    const sets = this.flashcardStore.sets();

    if (sets.length === 0) {
      return 0;
    }

    const totalProgress = sets.reduce((total, set) => total + set.progress, 0);

    return Math.round(totalProgress / sets.length);
  });

  readonly dueCards = computed(() =>
    this.flashcardStore
      .sets()
      .reduce(
        (total, set) =>
          total +
          Math.max(
            0,
            set.cards.length -
              Math.round(set.cards.length * (set.progress / 100)),
          ),
        0,
      ),
  );

  readonly recentActivities = computed<RecentActivity[]>(() =>
    this.recentSets()
      .filter((set) => set.cards.length > 0)
      .slice(0, 2)
      .map((set) => ({
        id: set.id,
        title: set.title,
        description:
          `${set.cards.length} cards · ` + this.formatUpdatedAt(set.updatedAt),
        result: `${set.progress}%`,
        color: set.color,
      })),
  );

  constructor(
    readonly flashcardStore: FlashcardStore,
    private readonly router: Router,
  ) {
    addIcons({
      barChartOutline,
      bookOutline,
      flameOutline,
      notificationsOutline,
      settingsOutline,
      timeOutline,
      trophyOutline,
    });
  }

  openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  openSettings(): void {
    void this.router.navigateByUrl('/settings');
  }

  openSet(setId: number): void {
    const set = this.flashcardStore.getSetById(setId);

    if (!set) {
      return;
    }

    if (set.cards.length === 0) {
      void this.router.navigate(['/sets', setId, 'edit']);

      return;
    }

    void this.router.navigate(['/study', setId]);
  }

  getThemeClass(color: FlashcardSetColor): string {
    return `theme-${color}`;
  }

  getCardLabel(set: FlashcardSet): string {
    return set.cards.length === 1 ? '1 card' : `${set.cards.length} cards`;
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
}
