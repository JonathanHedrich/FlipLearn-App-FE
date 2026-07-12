import { Location } from '@angular/common';
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

import { Flashcard } from '../../../core/models/flashcard.model';
import { FlashcardStore } from '../../../core/services/flashcard-store';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [FormsModule, IonContent, IonIcon],
  templateUrl: './editor.page.html',
  styleUrls: ['./editor.page.scss'],
})
export class EditorPage {
  readonly setId: number;

  editingCardId: number | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly flashcardStore: FlashcardStore,
  ) {
    this.setId = Number(this.route.snapshot.paramMap.get('setId')) || 0;

    addIcons({
      addOutline,
      arrowBackOutline,
      bookOutline,
      closeOutline,
      ellipsisVerticalOutline,
      trashOutline,
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

  get cardsComplete(): boolean {
    return (
      this.cards.length > 0 &&
      this.cards.every(
        (card) => card.front.trim().length > 0 && card.back.trim().length > 0,
      )
    );
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/sets');
  }

  toggleEdit(cardId: number): void {
    this.editingCardId = this.editingCardId === cardId ? null : cardId;
  }

  addCard(): void {
    const newCard = this.flashcardStore.addCard(this.setId);

    if (!newCard) {
      return;
    }

    this.editingCardId = newCard.id;

    window.setTimeout(() => {
      document.getElementById(`card-${newCard.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  }

  updateCard(cardId: number, field: 'front' | 'back', value: string): void {
    this.flashcardStore.updateCard(this.setId, cardId, {
      [field]: value,
    });
  }

  deleteCard(cardId: number): void {
    const confirmed = window.confirm(
      'Möchtest du diese Lernkarte wirklich löschen?',
    );

    if (!confirmed) {
      return;
    }

    this.flashcardStore.deleteCard(this.setId, cardId);

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
