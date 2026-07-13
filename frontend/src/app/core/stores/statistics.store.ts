import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  DailyStudyActivityResponse,
  StatisticsOverviewResponse,
} from '../models/statistics-api.model';
import { StatisticsApi } from '../services/statistics-api';

@Injectable({
  providedIn: 'root',
})
export class StatisticsStore {
  private readonly overviewState = signal<StatisticsOverviewResponse | null>(
    null,
  );

  private readonly loadingState = signal(false);

  private readonly errorState = signal('');

  private loaded = false;

  readonly overview = this.overviewState.asReadonly();

  readonly isLoading = this.loadingState.asReadonly();

  readonly error = this.errorState.asReadonly();

  readonly totalSets = computed(() => this.overviewState()?.totalSets ?? 0);

  readonly totalCards = computed(() => this.overviewState()?.totalCards ?? 0);

  readonly completedSessions = computed(
    () => this.overviewState()?.completedSessions ?? 0,
  );

  readonly totalReviews = computed(
    () => this.overviewState()?.totalReviews ?? 0,
  );

  readonly correctReviews = computed(
    () => this.overviewState()?.correctReviews ?? 0,
  );

  readonly incorrectReviews = computed(
    () => this.overviewState()?.incorrectReviews ?? 0,
  );

  readonly accuracy = computed(() => this.overviewState()?.accuracy ?? 0);

  readonly reviewsToday = computed(
    () => this.overviewState()?.reviewsToday ?? 0,
  );

  readonly todayAccuracy = computed(
    () => this.overviewState()?.todayAccuracy ?? 0,
  );

  readonly lastSevenDays = computed<DailyStudyActivityResponse[]>(
    () => this.overviewState()?.lastSevenDays ?? [],
  );

  readonly maximumDailyReviews = computed(() => {
    const reviews = this.lastSevenDays().map((activity) => activity.reviews);

    return Math.max(1, ...reviews);
  });

  readonly reviewsThisWeek = computed(
    () => this.overviewState()?.reviewsThisWeek ?? 0,
  );

  readonly weeklyAccuracy = computed(
    () => this.overviewState()?.weeklyAccuracy ?? 0,
  );

  readonly weeklyStudyMinutes = computed(
    () => this.overviewState()?.weeklyStudyMinutes ?? 0,
  );

  readonly currentStreak = computed(
    () => this.overviewState()?.currentStreak ?? 0,
  );

  readonly setAccuracies = computed(
    () => this.overviewState()?.setAccuracies ?? [],
  );

  readonly studyCalendar = computed(
    () => this.overviewState()?.studyCalendar ?? [],
  );

  readonly achievements = computed(
    () => this.overviewState()?.achievements ?? [],
  );

  readonly earnedAchievements = computed(
    () =>
      this.achievements().filter((achievement) => achievement.earned).length,
  );

  constructor(private readonly statisticsApi: StatisticsApi) {}

  async loadOverview(force = false): Promise<void> {
    if (this.loadingState() || (this.loaded && !force)) {
      return;
    }

    this.loadingState.set(true);
    this.errorState.set('');

    try {
      const overview = await firstValueFrom(this.statisticsApi.getOverview());

      this.overviewState.set(overview);
      this.loaded = true;
    } catch (error: unknown) {
      this.errorState.set(this.resolveError(error));

      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  clear(): void {
    this.overviewState.set(null);
    this.loadingState.set(false);
    this.errorState.set('');
    this.loaded = false;
  }

  private resolveError(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      error.status === 0
    ) {
      return 'Das Backend ist nicht erreichbar.';
    }

    return 'Die Statistiken konnten nicht geladen werden.';
  }
}
