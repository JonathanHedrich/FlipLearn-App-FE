import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkOutline,
  closeOutline,
  refreshOutline,
  starOutline,
  starSharp,
  trophyOutline,
} from 'ionicons/icons';

import { Flashcard } from '../../../core/models/flashcard.model';
import { FlashcardStore } from '../../../core/services/flashcard-store';

type StudyRating = 'again' | 'hard' | 'good' | 'easy';

@Component({
  selector: 'app-study-session',
  standalone: true,
  imports: [IonContent, IonIcon],
  templateUrl: './study-session.page.html',
  styleUrls: ['./study-session.page.scss'],
})
export class StudySessionPage {
  readonly setId: number;

  currentIndex = 0;
  isFlipped = false;
  sessionComplete = false;

  correctAnswers = 0;
  incorrectAnswers = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly flashcardStore: FlashcardStore,
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

  get currentSet() {
    return this.flashcardStore.getSetById(this.setId);
  }

  get setTitle(): string {
    return this.currentSet?.title ?? 'Unbekanntes Lernset';
  }

  get cards(): Flashcard[] {
    return this.currentSet?.cards ?? [];
  }

  get currentCard(): Flashcard | undefined {
    return this.cards[this.currentIndex];
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

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/sets');
  }

  flipCard(): void {
    if (!this.currentCard) {
      return;
    }

    this.isFlipped = !this.isFlipped;
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();

    if (!this.currentCard) {
      return;
    }

    this.flashcardStore.updateCard(this.setId, this.currentCard.id, {
      favorite: !this.currentCard.favorite,
    });
  }

  rateCard(rating: StudyRating): void {
    if (!this.isFlipped || !this.currentCard) {
      return;
    }

    if (rating === 'again' || rating === 'hard') {
      this.incorrectAnswers += 1;
    } else {
      this.correctAnswers += 1;
    }

    this.nextCard();
  }

  restartSession(): void {
    this.currentIndex = 0;
    this.isFlipped = false;
    this.sessionComplete = false;
    this.correctAnswers = 0;
    this.incorrectAnswers = 0;
  }

  goHome(): void {
    void this.router.navigateByUrl('/home', {
      replaceUrl: true,
    });
  }

  goToEditor(): void {
    void this.router.navigate(['/sets', this.setId, 'edit']);
  }

  private nextCard(): void {
    if (this.currentIndex >= this.cards.length - 1) {
      this.sessionComplete = true;
      this.updateSetProgress();
      return;
    }

    this.currentIndex += 1;
    this.isFlipped = false;
  }

  private updateSetProgress(): void {
    this.flashcardStore.updateSet(this.setId, {
      progress: this.accuracy,
    });
  }
}
