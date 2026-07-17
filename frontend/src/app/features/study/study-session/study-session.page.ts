import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { firstValueFrom } from 'rxjs';

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

import { StudyModeOption } from '../../../core/models/study-mode-option.model';
import {
  StudyCardResponse,
  StudyMode,
  StudyRating,
  StudySessionResponse,
} from '../../../core/models/study-api.model';

import { AppNotificationService } from '../../../core/services/app-notification.service';
import { FlashcardApi } from '../../../core/services/flashcard-api';
import { StudyApi } from '../../../core/services/study-api';

import { FlashcardStore } from '../../../core/stores/flashcard.store';
import { StatisticsStore } from '../../../core/stores/statistics.store';

import { FitTextDirective } from '../../../shared/directives/fit-text.directive';

@Component({
  selector: 'app-study-session',
  standalone: true,
  imports: [IonContent, IonIcon, FitTextDirective, TranslatePipe],
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

  /*
   * title, description und badge enthalten
   * Übersetzungsschlüssel. Im Template werden
   * sie mit dem TranslatePipe übersetzt.
   */
  readonly studyModeOptions: StudyModeOption[] = [
    {
      value: 'ALL',
      title: 'studySession.modes.all.title',
      description: 'studySession.modes.all.description',
      icon: 'albums-outline',
      available: true,
    },
    {
      value: 'RANDOM',
      title: 'studySession.modes.random.title',
      description: 'studySession.modes.random.description',
      icon: 'shuffle-outline',
      available: true,
    },
    {
      value: 'FAVORITES',
      title: 'studySession.modes.favorites.title',
      description: 'studySession.modes.favorites.description',
      icon: 'star-outline',
      available: true,
    },
    {
      value: 'DIFFICULT',
      title: 'studySession.modes.difficult.title',
      description: 'studySession.modes.difficult.description',
      icon: 'flame-outline',
      badge: 'studySession.modes.difficult.badge',
      available: true,
    },
    {
      value: 'WRONG_ONLY',
      title: 'studySession.modes.wrongOnly.title',
      description: 'studySession.modes.wrongOnly.description',
      icon: 'close-circle-outline',
      available: true,
    },
    {
      value: 'NEW_ONLY',
      title: 'studySession.modes.newOnly.title',
      description: 'studySession.modes.newOnly.description',
      icon: 'sparkles-outline',
      available: true,
    },
    {
      value: 'DUE_ONLY',
      title: 'studySession.modes.dueOnly.title',
      description: 'studySession.modes.dueOnly.description',
      icon: 'time-outline',
      available: true,
    },
    {
      value: 'FAVORITES_DUE',
      title: 'studySession.modes.favoritesDue.title',
      description: 'studySession.modes.favoritesDue.description',
      icon: 'heart-circle-outline',
      available: true,
    },
    {
      value: 'MARATHON',
      title: 'studySession.modes.marathon.title',
      description: 'studySession.modes.marathon.description',
      icon: 'fitness-outline',
      available: true,
      badge: 'studySession.modes.marathon.badge',
    },
    {
      value: 'LIGHTNING',
      title: 'studySession.modes.lightning.title',
      description: 'studySession.modes.lightning.description',
      icon: 'flash-outline',
      available: true,
      badge: 'studySession.modes.lightning.badge',
    },
    {
      value: 'EXAM',
      title: 'studySession.modes.exam.title',
      description: 'studySession.modes.exam.description',
      icon: 'school-outline',
      available: true,
      badge: 'studySession.modes.exam.badge',
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
    private readonly translate: TranslateService,
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
    return (
      this.session?.setTitle ??
      this.translate.instant('studySession.defaultSetTitle')
    );
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

  get selectedStudyModeLabel(): string {
    const translationKey =
      this.studyModeOptions.find(
        (option) => option.value === this.selectedStudyMode,
      )?.title ?? 'studySession.modes.all.title';

    return this.translate.instant(translationKey);
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

  get examProgressCount(): number {
    if (!this.isExamMode) {
      return 0;
    }

    return Math.min(
      this.currentIndex + (this.isFlipped ? 1 : 0),
      this.cards.length,
    );
  }

  async startSession(): Promise<void> {
    if (!this.setId) {
      this.loadError = this.translate.instant(
        'studySession.errors.invalidSetId',
      );

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
    if (
      !this.currentCard ||
      this.isSubmittingRating ||
      this.isPreparingMarathonRound ||
      this.sessionComplete
    ) {
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
      window.alert(
        this.translate.instant('studySession.errors.favoriteSaveFailed'),
      );
    }
  }

  async rateCard(rating: StudyRating): Promise<void> {
    const card = this.currentCard;
    const session = this.session;

    if (
      !this.isFlipped ||
      !card ||
      !session ||
      this.isSubmittingRating ||
      this.isPreparingMarathonRound ||
      this.sessionComplete
    ) {
      return;
    }

    this.stopLightningTimer();
    this.isSubmittingRating = true;

    /*
     * Session und Karte werden für diesen
     * Request festgehalten. Dadurch kann ein
     * alter Request keine neue Marathon-Runde
     * überschreiben.
     */
    const submittedSessionId = session.sessionId;

    const submittedCardId = card.id;

    try {
      const response = await firstValueFrom(
        this.studyApi.submitReview(submittedSessionId, {
          cardId: submittedCardId,
          rating,
        }),
      );

      /*
       * Wurde inzwischen eine neue Session
       * gestartet, gehört diese Antwort noch
       * zur alten Runde.
       */
      if (this.session?.sessionId !== submittedSessionId) {
        return;
      }

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
          if (response.incorrectAnswers > 0) {
            await this.startNextMarathonRound();
            return;
          }

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
      /*
       * Falls inzwischen bereits eine andere
       * Marathon-Runde aktiv ist, ignorieren
       * wir den verspäteten Fehler der alten
       * Runde.
       */
      if (this.session?.sessionId !== submittedSessionId) {
        return;
      }

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
      return this.translate.instant('studySession.errors.startFailed');
    }

    if (error.status === 0) {
      return this.translate.instant('studySession.errors.backendUnavailable');
    }

    if (error.status === 401) {
      return this.translate.instant('studySession.errors.sessionExpired');
    }

    if (error.status === 404) {
      return this.translate.instant('studySession.errors.setNotFound');
    }

    if (error.status === 409) {
      return (
        this.extractApiMessage(error) ??
        this.translate.instant('studySession.errors.noCardsAvailable')
      );
    }

    return (
      this.extractApiMessage(error) ??
      this.translate.instant('studySession.errors.startFailed')
    );
  }

  private resolveReviewError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return this.translate.instant('studySession.errors.backendUnavailable');
      }

      if (error.status === 401) {
        return this.translate.instant('studySession.errors.sessionExpired');
      }

      const message = this.extractApiMessage(error);

      if (message) {
        return message;
      }
    }

    return this.translate.instant('studySession.errors.reviewSaveFailed');
  }

  private extractApiMessage(error: HttpErrorResponse): string | null {
    if (
      typeof error.error !== 'object' ||
      error.error === null ||
      !('message' in error.error) ||
      typeof error.error.message !== 'string'
    ) {
      return null;
    }

    const message = error.error.message.trim();

    return message.length > 0 ? message : null;
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
      this.isSubmittingRating ||
      this.isPreparingMarathonRound
    ) {
      return;
    }

    this.isFlipped = true;

    await this.rateCard('AGAIN');
  }

  private async startNextMarathonRound(): Promise<void> {
    if (this.isPreparingMarathonRound || !this.session) {
      return;
    }

    this.isPreparingMarathonRound = true;

    this.stopLightningTimer();

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

      /*
       * Entscheidend:
       * Ab jetzt muss jede weitere Bewertung
       * an die neue Session gesendet werden.
       */
      this.session = nextSession;

      this.orderedCards = [...nextSession.cards];

      this.currentIndex = 0;
      this.isFlipped = false;
      this.sessionComplete = false;

      this.correctAnswers = nextSession.correctAnswers;

      this.incorrectAnswers = nextSession.incorrectAnswers;

      this.marathonRound += 1;

      this.startLightningTimer();
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse && error.status === 409) {
        /*
         * Keine falschen Karten mehr
         * vorhanden: Marathon erfolgreich
         * abgeschlossen.
         */
        this.sessionComplete = true;
        return;
      }

      this.loadError = this.resolveSessionError(error);
    } finally {
      this.isPreparingMarathonRound = false;
    }
  }
}
