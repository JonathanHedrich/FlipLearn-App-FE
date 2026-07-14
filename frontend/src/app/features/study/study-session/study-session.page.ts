import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';

import { StatisticsStore } from '../../../core/stores/statistics.store';

import {
  arrowBackOutline,
  checkmarkOutline,
  closeOutline,
  refreshOutline,
  starOutline,
  starSharp,
  trophyOutline,
} from 'ionicons/icons';

import {
  StudyCardResponse,
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
export class StudySessionPage {
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

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly studyApi: StudyApi,
    private readonly flashcardApi: FlashcardApi,
    private readonly flashcardStore: FlashcardStore,
    private readonly statisticsStore: StatisticsStore,
  ) {
    this.setId = Number(this.route.snapshot.paramMap.get('setId')) || 0;

    addIcons({
      arrowBackOutline,
      checkmarkOutline,
      closeOutline,
      refreshOutline,
      starOutline,
      starSharp,
      trophyOutline,
    });
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
          mode: 'ALL',
        }),
      );

      this.session = session;

      this.orderedCards = this.applyCardOrder(session.cards);

      this.correctAnswers = session.correctAnswers;

      this.incorrectAnswers = session.incorrectAnswers;
    } catch (error: unknown) {
      this.loadError = this.resolveSessionError(error);
    } finally {
      this.isLoading = false;
    }
  }

  goBack(): void {
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

      void this.statisticsStore.loadOverview(true);

      if (response.sessionComplete) {
        this.sessionComplete = true;
        return;
      }

      this.currentIndex += 1;
      this.isFlipped = false;
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
}
