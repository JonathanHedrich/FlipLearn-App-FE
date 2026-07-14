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
import { AppNotificationService } from '../../../core/services/app-notification.service';

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

  readonly selectedChartIndex = signal<number | null>(null);

  readonly isChartPointerActive = signal(false);

  /*
   * Das SVG besitzt einen festen Koordinatenraum.
   *
   * Links bleiben 34 Einheiten für die Y-Skala frei.
   * Rechts bleiben 8 Einheiten Abstand zur Kartenkante.
   */
  readonly chartWidth = 300;
  readonly chartHeight = 150;

  readonly chartPlotLeft = 34;
  readonly chartPlotRight = 292;
  readonly chartPlotTop = 54;
  readonly chartPlotBottom = 126;

  readonly chartMaximum = computed(() => {
    const values = this.lastSevenDays().map((activity) => activity.reviews);

    const rawMaximum = Math.max(0, ...values);

    /*
     * Die Skala verwendet gut lesbare Schritte:
     * 0, 20, 40, 60, 80 ...
     */
    return Math.max(20, Math.ceil(rawMaximum / 20) * 20);
  });

  readonly chartYAxisTicks = computed(() => {
    const maximum = this.chartMaximum();

    return [1, 0.75, 0.5, 0.25, 0].map((factor) => {
      const value = Math.round(maximum * factor);

      const y =
        this.chartPlotBottom -
        factor * (this.chartPlotBottom - this.chartPlotTop);

      return {
        value,
        y,
      };
    });
  });

  readonly chartData = computed(() => {
    const activities = this.lastSevenDays();

    if (activities.length === 0) {
      return [];
    }

    const plotWidth = this.chartPlotRight - this.chartPlotLeft;

    const plotHeight = this.chartPlotBottom - this.chartPlotTop;

    const maximum = this.chartMaximum();

    return activities.map((activity, index) => {
      const x =
        activities.length === 1
          ? this.chartPlotLeft + plotWidth / 2
          : this.chartPlotLeft + index * (plotWidth / (activities.length - 1));

      const normalizedReviews = maximum > 0 ? activity.reviews / maximum : 0;

      const y = this.chartPlotBottom - normalizedReviews * plotHeight;

      return {
        ...activity,
        index,
        x,
        y,
      };
    });
  });

  readonly chartPoints = computed(() =>
    this.chartData()
      .map((point) => `${point.x},${point.y}`)
      .join(' '),
  );

  readonly chartAreaPoints = computed(() => {
    const points = this.chartData();

    if (points.length === 0) {
      return '';
    }

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    return [
      `${firstPoint.x},${this.chartPlotBottom}`,
      ...points.map((point) => `${point.x},${point.y}`),
      `${lastPoint.x},${this.chartPlotBottom}`,
    ].join(' ');
  });

  readonly selectedChartPoint = computed(() => {
    const index = this.selectedChartIndex();

    if (index === null) {
      return null;
    }

    return this.chartData()[index] ?? null;
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

  readonly unreadNotifications = this.appNotificationService.unreadCount;

  selectedAchievement: AchievementResponse | null = null;

  constructor(
    readonly statisticsStore: StatisticsStore,
    private readonly location: Location,
    private readonly router: Router,
    readonly appNotificationService: AppNotificationService,
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
      await this.statisticsStore.loadOverview(true);

      this.appNotificationService.rebuildNotifications();
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

  handleChartPointerDown(event: PointerEvent): void {
    const element = event.currentTarget as HTMLElement;

    this.isChartPointerActive.set(true);

    element.setPointerCapture?.(event.pointerId);

    this.updateChartSelection(event, element);
  }

  handleChartPointerMove(event: PointerEvent): void {
    /*
     * Eine Maus darf den Chart bereits durch
     * Hover bedienen. Bei Touch reagieren wir
     * nur, nachdem der Finger aufgelegt wurde.
     */
    if (event.pointerType !== 'mouse' && !this.isChartPointerActive()) {
      return;
    }

    this.updateChartSelection(event, event.currentTarget as HTMLElement);
  }

  handleChartPointerUp(event: PointerEvent): void {
    const element = event.currentTarget as HTMLElement;

    this.updateChartSelection(event, element);

    this.isChartPointerActive.set(false);

    if (element.hasPointerCapture?.(event.pointerId)) {
      element.releasePointerCapture(event.pointerId);
    }
  }

  handleChartPointerCancel(): void {
    this.isChartPointerActive.set(false);
  }

  handleChartPointerLeave(event: PointerEvent): void {
    /*
     * Auf Desktop verschwindet die Auswahl,
     * sobald die Maus den Chart verlässt.
     * Auf Touch bleibt der zuletzt gewählte
     * Tageswert nach dem Loslassen sichtbar.
     */
    if (event.pointerType === 'mouse' && !this.isChartPointerActive()) {
      this.selectedChartIndex.set(null);
    }
  }

  selectChartPoint(index: number): void {
    this.selectedChartIndex.set(index);
  }

  private updateChartSelection(
    event: PointerEvent,
    element: HTMLElement,
  ): void {
    const points = this.chartData();

    if (points.length === 0) {
      return;
    }

    const bounds = element.getBoundingClientRect();

    /*
     * Die SVG-Koordinaten werden auf die reale
     * Breite des Elements übertragen.
     */
    const plotLeftPixels =
      bounds.width * (this.chartPlotLeft / this.chartWidth);

    const plotRightPixels =
      bounds.width * (this.chartPlotRight / this.chartWidth);

    const pointerX = event.clientX - bounds.left;

    const clampedX = Math.min(
      plotRightPixels,
      Math.max(plotLeftPixels, pointerX),
    );

    const usableWidth = plotRightPixels - plotLeftPixels;

    const normalizedX =
      usableWidth > 0 ? (clampedX - plotLeftPixels) / usableWidth : 0;

    const index = Math.min(
      points.length - 1,
      Math.max(0, Math.round(normalizedX * (points.length - 1))),
    );

    this.selectedChartIndex.set(index);
  }

  getFullDayLabel(dateValue: string): string {
    const date = new Date(`${dateValue}T00:00:00`);

    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
    }).format(date);
  }

  getLongDateLabel(dateValue: string): string {
    const date = new Date(`${dateValue}T00:00:00`);

    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  }

  getTooltipLeftPercent(pointX: number): number {
    const rawPercent = (pointX / this.chartWidth) * 100;

    /*
     * Der Tooltip bleibt vollständig innerhalb
     * des Chart-Bereichs.
     */
    return Math.min(76, Math.max(24, rawPercent));
  }
}
