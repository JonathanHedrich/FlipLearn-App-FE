import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';

import { StatisticsStore } from '../../../core/stores/statistics.store';
import { AppNotificationService } from '../../../core/services/app-notification.service';
import { StudyModeOption } from '../../../core/models/study-mode-option.model';

import {
  albumsOutline,
  arrowBackOutline,
  checkmarkOutline,
  chevronDownOutline,
  closeCircleOutline,
  closeOutline,
  fitnessOutline,
  flameOutline,
  flashOutline,
  heartCircleOutline,
  refreshOutline,
  schoolOutline,
  shuffleOutline,
  sparklesOutline,
  starOutline,
  starSharp,
  timeOutline,
  trophyOutline,
} from 'ionicons/icons';

import {
  StudyCardResponse,
  StudyMode,
  StudyRating,
  StudySessionResponse,
} from '../../../core/models/study-api.model';
import { FlashcardApi } from '../../../core/services/flashcard-api';
import { StudyApi } from '../../../core/services/study-api';
import { FlashcardStore } from '../../../core/stores/flashcard.store';

type CardOrder = 'original' | 'random' | 'difficult' | 'favorites';

const CARD_ORDER_STORAGE_KEY = 'fliplearn.cardOrder';

@Component({
  selector: 'app-study-session',
  standalone: true,
  imports: [IonContent, IonIcon],
  templateUrl: './study-session.page.html',
  styleUrls: ['./study-session.page.scss'],
})
export class StudySessionPage implements OnDestroy {
  readonly setId: number;

  session: StudySessionResponse | null = null;
  orderedCards: StudyCardResponse[] = [];

  currentIndex = 0;
  isFlipped = false;
  sessionComplete = false;

  correctAnswers = 0;
  incorrectAnswers = 0;

  isLoading = true;
  isSubmittingRating = false;
  loadError = '';

  selectedStudyMode: StudyMode = 'ALL';

  studyModeMenuOpen = false;

  readonly lightningDurationSeconds = 5;

  readonly lightningSecondsLeft = signal(this.lightningDurationSeconds);

  readonly lightningProgress = signal(100);

  private lightningIntervalId: ReturnType<typeof window.setInterval> | null =
    null;

  readonly studyModeOptions: StudyModeOption[] = [
    {
      value: 'ALL',
      title: 'All Cards',
      description: 'Alle Karten des Lernsets lernen.',
      icon: 'albums-outline',
      available: true,
    },
    {
      value: 'RANDOM',
      title: 'Random',
      description: 'Alle Karten in zufälliger Reihenfolge.',
      icon: 'shuffle-outline',
      available: true,
    },
    {
      value: 'FAVORITES',
      title: 'Favorites',
      description: 'Nur favorisierte Karten lernen.',
      icon: 'star-outline',
      available: true,
    },
    {
      value: 'DIFFICULT',
      title: 'Difficult',
      description: 'Schwierige Karten zuerst lernen.',
      icon: 'flame-outline',
      available: true,
    },
    {
      value: 'WRONG_ONLY',
      title: 'Wrong Answers Only',
      description: 'Nur Karten lernen, die zuletzt falsch beantwortet wurden.',
      icon: 'close-circle-outline',
      available: true,
    },
    {
      value: 'NEW_ONLY',
      title: 'New Cards Only',
      description: 'Nur Karten lernen, die noch nie beantwortet wurden.',
      icon: 'sparkles-outline',
      available: true,
    },
    {
      value: 'DUE_ONLY',
      title: 'Due Cards Only',
      description: 'Nur aktuell fällige Karten lernen.',
      icon: 'time-outline',
      available: true,
    },
    {
      value: 'FAVORITES_DUE',
      title: 'Favorites + Due',
      description: 'Nur favorisierte Karten, die aktuell fällig sind.',
      icon: 'heart-circle-outline',
      available: true,
    },
    {
      value: 'MARATHON',
      title: 'Marathon Mode',
      description: 'Alle verfügbaren Karten ohne Sitzungsbegrenzung.',
      icon: 'fitness-outline',
      available: true,
      badge: 'Long Session',
    },
    {
      value: 'LIGHTNING',
      title: 'Lightning Mode',
      description: 'Nur fünf Sekunden pro Karte.',
      icon: 'flash-outline',
      available: true,
      badge: '5 sec',
    },
    {
      value: 'EXAM',
      title: 'Exam Mode',
      description: 'Keine sofortige Auswertung. Ergebnis erst am Ende.',
      icon: 'school-outline',
      available: true,
      badge: 'No hints',
    },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly studyApi: StudyApi,
    private readonly flashcardApi: FlashcardApi,
    private readonly flashcardStore: FlashcardStore,
    private readonly statisticsStore: StatisticsStore,
    private readonly appNotificationService: AppNotificationService,
  ) {
    this.setId = Number(this.route.snapshot.paramMap.get('setId')) || 0;

    addIcons({
      arrowBackOutline,
      checkmarkOutline,
      chevronDownOutline,
      closeOutline,
      refreshOutline,
      starOutline,
      starSharp,
      trophyOutline,
      albumsOutline,
      closeCircleOutline,
      fitnessOutline,
      flameOutline,
      flashOutline,
      heartCircleOutline,
      schoolOutline,
      shuffleOutline,
      sparklesOutline,
      timeOutline,
    });
  }

  ngOnDestroy(): void {
    this.stopLightningTimer();
  }

  ionViewWillEnter(): void {
    void this.startSession();
  }

  get cards(): StudyCardResponse[] {
    return this.orderedCards;
  }

  get setTitle(): string {
    return this.session?.setTitle ?? 'Lernset';
  }

  get currentCard(): StudyCardResponse | null {
    return this.cards[this.currentIndex] ?? null;
  }

  get currentCardNumber(): number {
    return this.cards.length === 0 ? 0 : this.currentIndex + 1;
  }

  get progress(): number {
    if (this.cards.length === 0) {
      return 0;
    }

    return Math.round((this.currentCardNumber / this.cards.length) * 100);
  }

  get accuracy(): number {
    const answered = this.correctAnswers + this.incorrectAnswers;

    if (answered === 0) {
      return 0;
    }

    return Math.round((this.correctAnswers / answered) * 100);
  }

  async startSession(): Promise<void> {
    if (!this.setId) {
      this.loadError = 'Die Lernset-ID ist ungültig.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.loadError = '';
    this.resetLocalSession();

    try {
      const session = await firstValueFrom(
        this.studyApi.startSession({
          setId: this.setId,
          mode: this.selectedStudyMode,
        }),
      );

      this.session = session;

      this.orderedCards = this.applyCardOrder(session.cards);

      this.correctAnswers = session.correctAnswers;

      this.incorrectAnswers = session.incorrectAnswers;
      this.startLightningTimer();
    } catch (error: unknown) {
      this.loadError = this.resolveSessionError(error);
    } finally {
      this.isLoading = false;
    }
  }

  goBack(): void {
    this.stopLightningTimer();

    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/sets');
  }

  flipCard(): void {
    if (!this.currentCard || this.isSubmittingRating) {
      return;
    }

    this.isFlipped = !this.isFlipped;
  }

  async toggleFavorite(event: Event): Promise<void> {
    event.stopPropagation();

    const card = this.currentCard;

    if (!card) {
      return;
    }

    try {
      const updatedCard = await firstValueFrom(
        this.flashcardApi.updateCard(this.setId, card.id, {
          front: card.front,
          back: card.back,
          favorite: !card.favorite,
        }),
      );

      this.orderedCards = this.orderedCards.map((existingCard) =>
        existingCard.id === card.id
          ? {
              ...existingCard,
              favorite: updatedCard.favorite,
            }
          : existingCard,
      );
    } catch {
      window.alert('Der Favoritenstatus konnte nicht gespeichert werden.');
    }
  }

  async rateCard(rating: StudyRating): Promise<void> {
    const card = this.currentCard;

    if (!this.isFlipped || !card || !this.session || this.isSubmittingRating) {
      return;
    }

    this.stopLightningTimer();
    this.isSubmittingRating = true;

    try {
      const response = await firstValueFrom(
        this.studyApi.submitReview(this.session.sessionId, {
          cardId: card.id,
          rating,
        }),
      );

      this.correctAnswers = response.correctAnswers;

      this.incorrectAnswers = response.incorrectAnswers;

      this.flashcardStore.updateProgress(this.setId, response.setProgress);

      await this.statisticsStore.loadOverview(true);

      this.appNotificationService.rebuildNotifications();

      if (response.sessionComplete) {
        this.stopLightningTimer();
        this.sessionComplete = true;
        return;
      }

      this.currentIndex += 1;
      this.isFlipped = false;
      this.startLightningTimer();
    } catch (error: unknown) {
      window.alert(this.resolveReviewError(error));
    } finally {
      this.isSubmittingRating = false;
    }
  }

  async restartSession(): Promise<void> {
    await this.startSession();
  }

  goHome(): void {
    void this.router.navigateByUrl('/home', {
      replaceUrl: true,
    });
  }

  goToEditor(): void {
    void this.router.navigate(['/sets', this.setId, 'edit']);
  }

  private resetLocalSession(): void {
    this.stopLightningTimer();

    this.session = null;
    this.orderedCards = [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.sessionComplete = false;
    this.correctAnswers = 0;
    this.incorrectAnswers = 0;
  }

  private resolveSessionError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Die Lernsitzung konnte nicht gestartet werden.';
    }

    if (error.status === 0) {
      return 'Das Backend ist nicht erreichbar.';
    }

    if (error.status === 404) {
      return 'Das Lernset wurde nicht gefunden.';
    }

    if (error.status === 409) {
      return (
        error.error?.message ??
        'Für dieses Lernset sind aktuell keine Karten fällig.'
      );
    }

    return (
      error.error?.message ?? 'Die Lernsitzung konnte nicht gestartet werden.'
    );
  }

  private resolveReviewError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message as string;
    }

    return 'Die Bewertung konnte nicht gespeichert werden.';
  }

  private applyCardOrder(cards: StudyCardResponse[]): StudyCardResponse[] {
    const order = this.loadCardOrder();

    const orderedCards = [...cards];

    switch (order) {
      case 'random':
        return this.shuffleCards(orderedCards);

      case 'difficult':
        return orderedCards.sort((first, second) => {
          const firstDifficulty =
            first.repetitions === 0
              ? Number.MAX_SAFE_INTEGER
              : first.intervalDays;

          const secondDifficulty =
            second.repetitions === 0
              ? Number.MAX_SAFE_INTEGER
              : second.intervalDays;

          return firstDifficulty - secondDifficulty;
        });

      case 'favorites':
        return orderedCards.sort(
          (first, second) => Number(second.favorite) - Number(first.favorite),
        );

      case 'original':
      default:
        return orderedCards;
    }
  }

  private shuffleCards(cards: StudyCardResponse[]): StudyCardResponse[] {
    for (let index = cards.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));

      [cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]];
    }

    return cards;
  }

  private loadCardOrder(): CardOrder {
    const storedValue = localStorage.getItem(CARD_ORDER_STORAGE_KEY);

    if (
      storedValue === 'original' ||
      storedValue === 'random' ||
      storedValue === 'difficult' ||
      storedValue === 'favorites'
    ) {
      return storedValue;
    }

    return 'random';
  }

  openStudyModeMenu(): void {
    this.studyModeMenuOpen = true;
  }

  closeStudyModeMenu(): void {
    this.studyModeMenuOpen = false;
  }

  selectStudyMode(mode: StudyMode): void {
    this.selectedStudyMode = mode;
    this.studyModeMenuOpen = false;

    void this.startSession();
  }

  get selectedStudyModeLabel(): string {
    return (
      this.studyModeOptions.find(
        (option) => option.value === this.selectedStudyMode,
      )?.title ?? 'All Cards'
    );
  }

  get activeStudyMode(): StudyMode {
    return this.session?.mode ?? this.selectedStudyMode;
  }

  get isLightningMode(): boolean {
    return this.activeStudyMode === 'LIGHTNING';
  }

  private startLightningTimer(): void {
    this.stopLightningTimer();

    if (!this.isLightningMode || !this.currentCard || this.sessionComplete) {
      return;
    }

    this.lightningSecondsLeft.set(this.lightningDurationSeconds);

    this.lightningProgress.set(100);

    const startedAt = Date.now();

    this.lightningIntervalId = window.setInterval(() => {
      const elapsedMilliseconds = Date.now() - startedAt;

      const elapsedSeconds = elapsedMilliseconds / 1000;

      const remainingSeconds = Math.max(
        0,
        this.lightningDurationSeconds - elapsedSeconds,
      );

      this.lightningSecondsLeft.set(Math.ceil(remainingSeconds));

      this.lightningProgress.set(
        Math.max(
          0,
          Math.round((remainingSeconds / this.lightningDurationSeconds) * 100),
        ),
      );

      if (remainingSeconds <= 0) {
        this.stopLightningTimer();

        void this.handleLightningTimeout();
      }
    }, 100);
  }

  private stopLightningTimer(): void {
    if (this.lightningIntervalId === null) {
      return;
    }

    window.clearInterval(this.lightningIntervalId);

    this.lightningIntervalId = null;
  }

  private async handleLightningTimeout(): Promise<void> {
    if (
      !this.currentCard ||
      !this.session ||
      this.sessionComplete ||
      this.isSubmittingRating
    ) {
      return;
    }

    /*
     * Die Rückseite wird bei Ablauf kurz sichtbar,
     * bevor die Karte als falsch bewertet wird.
     */
    this.isFlipped = true;

    await this.rateCard('AGAIN');
  }
}
