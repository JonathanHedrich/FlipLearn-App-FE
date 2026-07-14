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

  examAnsweredCards = 0;

  marathonRound = 1;
  marathonCorrectAnswers = 0;
  marathonIncorrectAnswers = 0;
  isPreparingMarathonRound = false;

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
      badge: 'SMART',
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
      description:
        'Nur Karten lernen, deren nächste Wiederholung jetzt fällig ist.',
      icon: 'time-outline',
      available: true,
    },
    {
      value: 'FAVORITES_DUE',
      title: 'Favorites + Due',
      description:
        'Nur favorisierte Karten lernen, deren Wiederholung aktuell fällig ist.',
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
    const answered = this.totalAnsweredAttempts;

    if (answered === 0) {
      return 0;
    }

    return Math.round((this.displayedCorrectAnswers / answered) * 100);
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

    if (this.selectedStudyMode === 'MARATHON') {
      this.marathonRound = 1;
      this.marathonCorrectAnswers = 0;
      this.marathonIncorrectAnswers = 0;
    }

    try {
      const session = await firstValueFrom(
        this.studyApi.startSession({
          setId: this.setId,
          mode: this.selectedStudyMode,
        }),
      );

      this.session = session;

      this.orderedCards = [...session.cards];

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

      if (this.isExamMode) {
        this.examAnsweredCards += 1;
      }

      if (this.isMarathonMode) {
        if (response.answeredCorrectly) {
          this.marathonCorrectAnswers += 1;
        } else {
          this.marathonIncorrectAnswers += 1;
        }
      }

      this.correctAnswers = response.correctAnswers;

      this.incorrectAnswers = response.incorrectAnswers;

      this.flashcardStore.updateProgress(this.setId, response.setProgress);

      await this.statisticsStore.loadOverview(true);

      this.appNotificationService.rebuildNotifications();

      if (response.sessionComplete) {
        this.stopLightningTimer();

        if (this.isMarathonMode) {
          /*
           * response.incorrectAnswers betrifft nur
           * die gerade abgeschlossene Runde.
           */
          if (response.incorrectAnswers > 0) {
            await this.startNextMarathonRound();
            return;
          }

          /*
           * In dieser Runde wurde alles richtig
           * beantwortet: Marathon abgeschlossen.
           */
          this.sessionComplete = true;
          return;
        }

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

    this.marathonRound = 1;
    this.marathonCorrectAnswers = 0;
    this.marathonIncorrectAnswers = 0;
    this.isPreparingMarathonRound = false;

    this.examAnsweredCards = 0;
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

  get isExamMode(): boolean {
    return this.selectedStudyMode === 'EXAM';
  }

  get isMarathonMode(): boolean {
    return this.selectedStudyMode === 'MARATHON';
  }

  get isLightningMode(): boolean {
    return this.selectedStudyMode === 'LIGHTNING';
  }

  get activeStudyMode(): StudyMode {
    return this.session?.mode ?? this.selectedStudyMode;
  }

  get displayedCorrectAnswers(): number {
    if (this.isMarathonMode) {
      return this.marathonCorrectAnswers;
    }

    return this.correctAnswers;
  }

  get displayedIncorrectAnswers(): number {
    if (this.isMarathonMode) {
      return this.marathonIncorrectAnswers;
    }

    return this.incorrectAnswers;
  }

  get totalAnsweredAttempts(): number {
    return this.displayedCorrectAnswers + this.displayedIncorrectAnswers;
  }

  private async startNextMarathonRound(): Promise<void> {
    if (this.isPreparingMarathonRound || !this.session) {
      return;
    }

    this.isPreparingMarathonRound = true;
    this.loadError = '';

    /*
     * Die aktuelle Session ist die gerade
     * abgeschlossene Marathon-Runde.
     */
    const completedSessionId = this.session.sessionId;

    try {
      const nextSession = await firstValueFrom(
        this.studyApi.startSession({
          setId: this.setId,
          mode: 'WRONG_ONLY',
          sourceSessionId: completedSessionId,
        }),
      );

      this.orderedCards = [...nextSession.cards];

      this.currentIndex = 0;
      this.isFlipped = false;
      this.sessionComplete = false;

      this.correctAnswers = nextSession.correctAnswers;

      this.incorrectAnswers = nextSession.incorrectAnswers;

      this.marathonRound += 1;
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        this.sessionComplete = true;
        return;
      }

      this.loadError =
        'Die nächste Marathon-Runde konnte nicht gestartet werden.';
    } finally {
      this.isPreparingMarathonRound = false;
    }
  }
  get examProgressCount(): number {
    if (!this.isExamMode) {
      return 0;
    }

    return Math.min(
      this.currentIndex + (this.isFlipped ? 1 : 0),
      this.cards.length,
    );
  }
}
