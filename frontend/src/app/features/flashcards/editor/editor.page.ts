import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  arrowBackOutline,
  bookOutline,
  closeOutline,
  ellipsisVerticalOutline,
  trashOutline,
} from 'ionicons/icons';

interface Flashcard {
  id: number;
  front: string;
  back: string;
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [FormsModule, IonContent, IonIcon],
  templateUrl: './editor.page.html',
  styleUrls: ['./editor.page.scss'],
})
export class EditorPage {
  readonly setId: number;
  readonly setTitle = 'Spanish Vocabulary';

  editingCardId: number | null = null;

  cards: Flashcard[] = [
    {
      id: 1,
      front: 'Hello',
      back: 'Hola',
    },
    {
      id: 2,
      front: 'Goodbye',
      back: 'Adiós',
    },
    {
      id: 3,
      front: 'Thank you',
      back: 'Gracias',
    },
    {
      id: 4,
      front: 'Please',
      back: 'Por favor',
    },
    {
      id: 5,
      front: 'Good morning',
      back: 'Buenos días',
    },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.setId = Number(this.route.snapshot.paramMap.get('setId')) || 1;

    addIcons({
      addOutline,
      arrowBackOutline,
      bookOutline,
      closeOutline,
      ellipsisVerticalOutline,
      trashOutline,
    });
  }

  get cardsComplete(): boolean {
    return (
      this.cards.length > 0 &&
      this.cards.every(
        (card) => card.front.trim().length > 0 && card.back.trim().length > 0,
      )
    );
  }

  goBack(): void {
    void this.router.navigateByUrl('/sets');
  }

  toggleEdit(cardId: number): void {
    this.editingCardId = this.editingCardId === cardId ? null : cardId;
  }

  addCard(): void {
    const newCard: Flashcard = {
      id: Date.now(),
      front: '',
      back: '',
    };

    this.cards.push(newCard);
    this.editingCardId = newCard.id;

    window.setTimeout(() => {
      document.getElementById(`card-${newCard.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }

  deleteCard(cardId: number): void {
    const confirmed = window.confirm(
      'Möchtest du diese Lernkarte wirklich löschen?',
    );

    if (!confirmed) {
      return;
    }

    this.cards = this.cards.filter((card) => card.id !== cardId);

    if (this.editingCardId === cardId) {
      this.editingCardId = null;
    }
  }

  startStudying(): void {
    if (!this.cardsComplete) {
      return;
    }

    void this.router.navigate(['/study', this.setId]);
  }
}
