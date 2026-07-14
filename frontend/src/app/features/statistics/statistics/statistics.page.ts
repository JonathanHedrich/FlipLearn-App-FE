import { CommonModule, Location } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  albumsOutline,
  arrowBackOutline,
  barChartOutline,
  bookOutline,
  calendarOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  diamondOutline,
  fitnessOutline,
  flameOutline,
  flashOutline,
  hardwareChipOutline,
  heartOutline,
  layersOutline,
  libraryOutline,
  locateOutline,
  medalOutline,
  notificationsOutline,
  playOutline,
  radioButtonOnOutline,
  refreshOutline,
  ribbonOutline,
  rocketOutline,
  schoolOutline,
  searchOutline,
  starOutline,
  timeOutline,
  trophyOutline,
} from 'ionicons/icons';

import { StatisticsStore } from '../../../core/stores/statistics.store';
import { FlBottomNavComponent } from '../../../shared/components/fl-bottom-nav/fl-bottom-nav.component';
import { AchievementResponse } from '../../../core/models/statistics-api.model';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, FlBottomNavComponent],
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
})
export class StatisticsPage {
  readonly isLoading = this.statisticsStore.isLoading;

  readonly loadError = this.statisticsStore.error;

  readonly totalReviews = this.statisticsStore.totalReviews;

  readonly correctReviews = this.statisticsStore.correctReviews;

  readonly incorrectReviews = this.statisticsStore.incorrectReviews;

  readonly lastSevenDays = this.statisticsStore.lastSevenDays;

  readonly reviewsThisWeek = this.statisticsStore.reviewsThisWeek;

  readonly weeklyAccuracy = this.statisticsStore.weeklyAccuracy;

  readonly weeklyStudyMinutes = this.statisticsStore.weeklyStudyMinutes;

  readonly currentStreak = this.statisticsStore.currentStreak;

  readonly bestDay = computed(() => {
    const activities = this.lastSevenDays();

    if (activities.length === 0) {
      return null;
    }

    return activities.reduce((best, current) =>
      current.reviews > best.reviews ? current : best,
    );
  });

  readonly chartPoints = computed(() => {
    const activities = this.lastSevenDays();

    if (activities.length === 0) {
      return '';
    }

    const width = 300;
    const height = 110;

    const maximum = Math.max(
      1,
      ...activities.map((activity) => activity.reviews),
    );

    return activities
      .map((activity, index) => {
        const x =
          activities.length === 1
            ? width / 2
            : index * (width / (activities.length - 1));

        const y = height - (activity.reviews / maximum) * 90 - 10;

        return `${x},${y}`;
      })
      .join(' ');
  });

  readonly setAccuracies = this.statisticsStore.setAccuracies;

  readonly studyCalendar = this.statisticsStore.studyCalendar;

  readonly achievements = this.statisticsStore.achievements;

  readonly earnedAchievements = this.statisticsStore.earnedAchievements;

  readonly showAllAchievements = signal(false);

  readonly visibleAchievements = computed(() => {
    const achievements = this.achievements();

    if (this.showAllAchievements()) {
      return achievements;
    }

    return achievements.slice(0, 12);
  });

  selectedAchievement: AchievementResponse | null = null;

  constructor(
    readonly statisticsStore: StatisticsStore,
    private readonly location: Location,
    private readonly router: Router,
  ) {
    addIcons({
      albumsOutline,
      arrowBackOutline,
      barChartOutline,
      bookOutline,
      calendarOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      diamondOutline,
      fitnessOutline,
      flameOutline,
      flashOutline,
      hardwareChipOutline,
      heartOutline,
      layersOutline,
      libraryOutline,
      locateOutline,
      medalOutline,
      notificationsOutline,
      playOutline,
      radioButtonOnOutline,
      refreshOutline,
      ribbonOutline,
      rocketOutline,
      schoolOutline,
      searchOutline,
      starOutline,
      timeOutline,
      trophyOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.loadStatistics();
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

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/home');
  }

  openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  async loadStatistics(): Promise<void> {
    try {
      await this.statisticsStore.loadOverview();
    } catch {
      // Der Fehler liegt bereits im Store.
    }
  }

  async reloadStatistics(): Promise<void> {
    try {
      await this.statisticsStore.loadOverview(true);
    } catch {
      // Der Fehler liegt bereits im Store.
    }
  }

  getDayLabel(dateValue: string): string {
    const date = new Date(`${dateValue}T00:00:00`);

    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
    }).format(date);
  }

  getDateLabel(dateValue: string): string {
    const date = new Date(`${dateValue}T00:00:00`);

    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
    }).format(date);
  }

  getSetColorClass(color: string): string {
    return `accuracy-${color}`;
  }

  getAchievementIcon(icon: string): string {
    const iconMap: Record<string, string> = {
      trophy: 'trophy-outline',
      flame: 'flame-outline',
      brain: 'hardware-chip-outline',
      flash: 'flash-outline',
      ribbon: 'ribbon-outline',
      target: 'locate-outline',
      radio: 'radio-button-on-outline',
      star: 'star-outline',
      heart: 'heart-outline',
      layers: 'layers-outline',
      library: 'library-outline',
      card: 'albums-outline',
      play: 'play-outline',
      school: 'school-outline',
      medal: 'medal-outline',
      rocket: 'rocket-outline',
      check: 'checkmark-circle-outline',
      search: 'search-outline',
      fitness: 'fitness-outline',
      diamond: 'diamond-outline',
      calendar: 'calendar-outline',
      time: 'time-outline',
    };

    return iconMap[icon] ?? 'trophy-outline';
  }

  openAchievement(achievement: AchievementResponse): void {
    this.selectedAchievement = achievement;
  }

  closeAchievement(): void {
    this.selectedAchievement = null;
  }

  getAchievementProgressLabel(achievement: AchievementResponse): string {
    if (achievement.earned) {
      return 'Freigeschaltet';
    }

    return `${achievement.currentValue}` + ` / ${achievement.targetValue}`;
  }

  toggleAchievements(): void {
    this.showAllAchievements.update((currentValue) => !currentValue);
  }
}
