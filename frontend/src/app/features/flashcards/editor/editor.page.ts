import { Location, NgClass } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';

import { FlashcardStore } from '../../../core/stores/flashcard.store';

import {
  addOutline,
  arrowBackOutline,
  closeOutline,
  createOutline,
  ellipsisVerticalOutline,
  trashOutline,
} from 'ionicons/icons';

import {
  FlashcardResponse,
  FlashcardSetResponse,
} from '../../../core/models/flashcard-api.model';

interface EditableFlashcard extends FlashcardResponse {
  draftFront: string;
  draftBack: string;
  isSaving: boolean;
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [NgClass, FormsModule, IonContent, IonIcon],
  templateUrl: './editor.page.html',
  styleUrls: ['./editor.page.scss'],
})
export class EditorPage {
  readonly setId: number;

  currentSet: FlashcardSetResponse | null = null;
  cards: EditableFlashcard[] = [];

  editingCardId: number | null = null;

  isLoading = true;
  isAddingCard = false;
  loadError = '';
  menuOpen = false;

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
      closeOutline,
      createOutline,
      ellipsisVerticalOutline,
      trashOutline,
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  ionViewWillEnter(): void {
    void this.loadEditorData();
  }

  get setTitle(): string {
    return this.currentSet?.title ?? 'Lernset';
  }

  get cardsComplete(): boolean {
    return (
      this.cards.length > 0 &&
      this.cards.every(
        (card) => card.front.trim().length > 0 && card.back.trim().length > 0,
      )
    );
  }

  async loadEditorData(): Promise<void> {
    if (!this.setId) {
      this.loadError = 'Die Lernset-ID ist ungültig.';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.loadError = '';

    try {
      const [set, cards] = await Promise.all([
        this.flashcardStore.loadSet(this.setId, true),
        this.flashcardStore.loadCards(this.setId, true),
      ]);

      this.currentSet = set;
      this.cards = cards.map((card) => this.toEditableCard(card));
    } catch (error: unknown) {
      this.loadError = this.resolveLoadError(error);
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

  toggleEdit(cardId: number): void {
    if (this.editingCardId === cardId) {
      this.cancelEdit(cardId);
      return;
    }

    const card = this.cards.find((item) => item.id === cardId);

    if (!card) {
      return;
    }

    card.draftFront = card.front;
    card.draftBack = card.back;
    this.editingCardId = cardId;
  }

  cancelEdit(cardId: number): void {
    const card = this.cards.find((item) => item.id === cardId);

    if (card) {
      card.draftFront = card.front;
      card.draftBack = card.back;
    }

    this.editingCardId = null;
  }

  async addCard(): Promise<void> {
    if (this.isAddingCard) {
      return;
    }

    this.isAddingCard = true;

    try {
      /*
       * Das Backend akzeptiert aktuell keine vollständig
       * leeren Karten. Deshalb erstellen wir einen kleinen
       * Platzhalter und öffnen sie sofort zum Bearbeiten.
       */
      const createdCard = await this.flashcardStore.createCard(this.setId, {
        front: 'Neue Vorderseite',
        back: 'Neue Rückseite',
      });

      const editableCard = this.toEditableCard(createdCard);

      editableCard.draftFront = '';
      editableCard.draftBack = '';

      this.cards = [...this.cards, editableCard];

      this.editingCardId = editableCard.id;

      window.setTimeout(() => {
        document.getElementById(`card-${editableCard.id}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    } catch {
      window.alert('Die Lernkarte konnte nicht erstellt werden.');
    } finally {
      this.isAddingCard = false;
    }
  }

  async saveCard(card: EditableFlashcard): Promise<void> {
    const front = card.draftFront.trim();
    const back = card.draftBack.trim();

    if (!front || !back) {
      window.alert('Vorder- und Rückseite dürfen nicht leer sein.');
      return;
    }

    if (card.isSaving) {
      return;
    }

    card.isSaving = true;

    try {
      const updatedCard = await this.flashcardStore.updateCard(
        this.setId,
        card.id,
        {
          front,
          back,
          favorite: card.favorite,
        },
      );

      this.replaceCard(this.toEditableCard(updatedCard));

      this.editingCardId = null;
    } catch {
      window.alert('Die Änderungen konnten nicht gespeichert werden.');
    } finally {
      const currentCard = this.cards.find((item) => item.id === card.id);

      if (currentCard) {
        currentCard.isSaving = false;
      }
    }
  }

  async deleteCard(cardId: number): Promise<void> {
    const confirmed = window.confirm(
      'Möchtest du diese Lernkarte wirklich löschen?',
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.flashcardStore.deleteCard(this.setId, cardId);

      this.cards = this.cards.filter((card) => card.id !== cardId);

      if (this.editingCardId === cardId) {
        this.editingCardId = null;
      }
    } catch {
      window.alert('Die Lernkarte konnte nicht gelöscht werden.');
    }
  }

  startStudying(): void {
    if (!this.cardsComplete) {
      window.alert('Fülle zuerst alle Karten vollständig aus.');
      return;
    }

    void this.router.navigate(['/study', this.setId]);
  }

  private replaceCard(updatedCard: EditableFlashcard): void {
    this.cards = this.cards.map((card) =>
      card.id === updatedCard.id ? updatedCard : card,
    );
  }

  private toEditableCard(card: FlashcardResponse): EditableFlashcard {
    return {
      ...card,
      draftFront: card.front,
      draftBack: card.back,
      isSaving: false,
    };
  }

  private resolveLoadError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Die Daten konnten nicht geladen werden.';
    }

    if (error.status === 0) {
      return 'Das Backend ist nicht erreichbar.';
    }

    if (error.status === 404) {
      return 'Das Lernset wurde nicht gefunden.';
    }

    return error.error?.message ?? 'Der Editor konnte nicht geladen werden.';
  }

  async deleteSet(): Promise<void> {
    const confirmed = window.confirm(
      `Möchtest du das Lernset „${this.setTitle}“ wirklich löschen? Alle Karten werden ebenfalls gelöscht.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.flashcardStore.deleteSet(this.setId);

      await this.router.navigateByUrl('/sets', {
        replaceUrl: true,
      });
    } catch {
      window.alert('Das Lernset konnte nicht gelöscht werden.');
    }
  }

  editSet(): void {
    void this.router.navigate(['/sets', this.setId, 'settings']);
  }
}
