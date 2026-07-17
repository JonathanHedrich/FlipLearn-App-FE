import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';

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

import { AppNotificationService } from '../../../core/services/app-notification.service';
import { FlashcardStore } from '../../../core/stores/flashcard.store';

interface EditableFlashcard extends FlashcardResponse {
  draftFront: string;
  draftBack: string;
  isSaving: boolean;
}

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [FormsModule, IonContent, IonIcon, TranslatePipe],
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
    private readonly appNotificationService: AppNotificationService,
    private readonly translate: TranslateService,
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

  ionViewWillEnter(): void {
    void this.loadEditorData();
  }

  get setTitle(): string {
    return (
      this.currentSet?.title ??
      this.translate.instant('flashcardEditor.defaultSetTitle')
    );
  }

  get cardsComplete(): boolean {
    return (
      this.cards.length > 0 &&
      this.cards.every(
        (card) => card.front.trim().length > 0 && card.back.trim().length > 0,
      )
    );
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  async loadEditorData(): Promise<void> {
    if (!this.setId) {
      this.loadError = this.translate.instant(
        'flashcardEditor.errors.invalidSetId',
      );
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
       * leeren Karten. Die Platzhalter werden nicht sichtbar,
       * weil die Entwurfsfelder direkt geleert werden.
       */
      const createdCard = await this.flashcardStore.createCard(this.setId, {
        front: this.translate.instant(
          'flashcardEditor.newCard.placeholderFront',
        ),
        back: this.translate.instant('flashcardEditor.newCard.placeholderBack'),
      });

      const editableCard = this.toEditableCard(createdCard);

      editableCard.draftFront = '';
      editableCard.draftBack = '';

      this.cards = [...this.cards, editableCard];

      this.flashcardStore.updateCardCount(this.setId, this.cards.length);

      this.appNotificationService.rebuildNotifications();

      this.editingCardId = editableCard.id;

      window.setTimeout(() => {
        document.getElementById(`card-${editableCard.id}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    } catch {
      window.alert(
        this.translate.instant('flashcardEditor.errors.createCardFailed'),
      );
    } finally {
      this.isAddingCard = false;
    }
  }

  async saveCard(card: EditableFlashcard): Promise<void> {
    const front = card.draftFront.trim();
    const back = card.draftBack.trim();

    if (!front || !back) {
      window.alert(
        this.translate.instant('flashcardEditor.errors.cardSidesRequired'),
      );
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
      window.alert(
        this.translate.instant('flashcardEditor.errors.saveCardFailed'),
      );
    } finally {
      const currentCard = this.cards.find((item) => item.id === card.id);

      if (currentCard) {
        currentCard.isSaving = false;
      }
    }
  }

  async deleteCard(cardId: number): Promise<void> {
    const confirmed = window.confirm(
      this.translate.instant('flashcardEditor.confirmations.deleteCard'),
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.flashcardStore.deleteCard(this.setId, cardId);

      this.cards = this.cards.filter((card) => card.id !== cardId);

      this.flashcardStore.updateCardCount(this.setId, this.cards.length);

      this.appNotificationService.rebuildNotifications();

      if (this.editingCardId === cardId) {
        this.editingCardId = null;
      }
    } catch {
      window.alert(
        this.translate.instant('flashcardEditor.errors.deleteCardFailed'),
      );
    }
  }

  startStudying(): void {
    if (!this.cardsComplete) {
      window.alert(
        this.translate.instant('flashcardEditor.errors.incompleteCards'),
      );
      return;
    }

    void this.router.navigate(['/study', this.setId]);
  }

  async deleteSet(): Promise<void> {
    const confirmed = window.confirm(
      this.translate.instant('flashcardEditor.confirmations.deleteSet', {
        title: this.setTitle,
      }),
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
      window.alert(
        this.translate.instant('flashcardEditor.errors.deleteSetFailed'),
      );
    }
  }

  editSet(): void {
    void this.router.navigate(['/sets', this.setId, 'settings']);
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
      return this.translate.instant('flashcardEditor.errors.loadDataFailed');
    }

    if (error.status === 0) {
      return this.translate.instant(
        'flashcardEditor.errors.backendUnavailable',
      );
    }

    if (error.status === 401) {
      return this.translate.instant('flashcardEditor.errors.sessionExpired');
    }

    if (error.status === 404) {
      return this.translate.instant('flashcardEditor.errors.setNotFound');
    }

    if (
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return this.translate.instant('flashcardEditor.errors.editorLoadFailed');
  }
}
