import { Component } from '@angular/core';
import { Router } from '@angular/router';
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

interface StudyCard {
  id: number;
  front: string;
  back: string;
  favorite: boolean;
}

type StudyRating = 'again' | 'hard' | 'good' | 'easy';

@Component({
  selector: 'app-study-session',
  standalone: true,
  imports: [IonContent, IonIcon],
  templateUrl: './study-session.page.html',
  styleUrls: ['./study-session.page.scss'],
})
export class StudySessionPage {
  readonly setTitle = 'Spanish Vocabulary';

  readonly cards: StudyCard[] = [
    {
      id: 1,
      front: 'Hello',
      back: 'Hola',
      favorite: false,
    },
    {
      id: 2,
      front: 'Goodbye',
      back: 'Adiós',
      favorite: true,
    },
    {
      id: 3,
      front: 'Thank you',
      back: 'Gracias',
      favorite: false,
    },
    {
      id: 4,
      front: 'Please',
      back: 'Por favor',
      favorite: false,
    },
    {
      id: 5,
      front: 'Good morning',
      back: 'Buenos días',
      favorite: false,
    },
  ];

  currentIndex = 0;
  isFlipped = false;
  sessionComplete = false;

  correctAnswers = 0;
  incorrectAnswers = 0;

  constructor(private readonly router: Router) {
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

  get currentCard(): StudyCard {
    return this.cards[this.currentIndex];
  }

  get currentCardNumber(): number {
    return this.currentIndex + 1;
  }

  get progress(): number {
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
    void this.router.navigateByUrl('/sets');
  }

  flipCard(): void {
    this.isFlipped = !this.isFlipped;
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    this.currentCard.favorite = !this.currentCard.favorite;
  }

  rateCard(rating: StudyRating): void {
    if (!this.isFlipped) {
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

  private nextCard(): void {
    if (this.currentIndex >= this.cards.length - 1) {
      this.sessionComplete = true;
      return;
    }

    this.currentIndex += 1;
    this.isFlipped = false;
  }
}
