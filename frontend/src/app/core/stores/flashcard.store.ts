import { Injectable, computed, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  CreateFlashcardRequest,
  CreateFlashcardSetRequest,
  FlashcardResponse,
  FlashcardSetResponse,
  UpdateFlashcardRequest,
  UpdateFlashcardSetRequest,
} from '../models/flashcard-api.model';
import { FlashcardApi } from '../services/flashcard-api';

@Injectable({
  providedIn: 'root',
})
export class FlashcardStore {
  private readonly setsState = signal<FlashcardSetResponse[]>([]);

  private readonly cardsBySetState = signal<
    Record<number, FlashcardResponse[]>
  >({});

  private readonly loadingSetsState = signal(false);

  private readonly loadingCardsState = signal<Record<number, boolean>>({});

  private readonly errorState = signal<string>('');

  private setsLoaded = false;

  readonly sets = this.setsState.asReadonly();

  readonly error = this.errorState.asReadonly();

  readonly isLoadingSets = this.loadingSetsState.asReadonly();

  readonly totalSets = computed(() => this.setsState().length);

  readonly totalCards = computed(() =>
    this.setsState().reduce((total, set) => total + set.cardCount, 0),
  );

  readonly favoriteSets = computed(() =>
    this.setsState().filter((set) => set.favorite),
  );

  constructor(private readonly flashcardApi: FlashcardApi) {}

  async loadSets(force = false): Promise<void> {
    if (this.loadingSetsState() || (this.setsLoaded && !force)) {
      return;
    }

    this.loadingSetsState.set(true);
    this.errorState.set('');

    try {
      const sets = await firstValueFrom(this.flashcardApi.getSets());

      this.setsState.set(sets);
      this.setsLoaded = true;
    } catch (error: unknown) {
      this.errorState.set(
        this.resolveError(error, 'Die Lernsets konnten nicht geladen werden.'),
      );

      throw error;
    } finally {
      this.loadingSetsState.set(false);
    }
  }

  getSet(setId: number): FlashcardSetResponse | undefined {
    return this.setsState().find((set) => set.id === setId);
  }

  cardsForSet(setId: number): FlashcardResponse[] {
    return this.cardsBySetState()[setId] ?? [];
  }

  isLoadingCards(setId: number): boolean {
    return this.loadingCardsState()[setId] ?? false;
  }

  async loadSet(setId: number, force = false): Promise<FlashcardSetResponse> {
    const existingSet = this.getSet(setId);

    if (existingSet && !force) {
      return existingSet;
    }

    const set = await firstValueFrom(this.flashcardApi.getSet(setId));

    this.upsertSet(set);

    return set;
  }

  async createSet(
    request: CreateFlashcardSetRequest,
  ): Promise<FlashcardSetResponse> {
    const createdSet = await firstValueFrom(
      this.flashcardApi.createSet(request),
    );

    this.setsState.update((sets) => [createdSet, ...sets]);

    this.cardsBySetState.update((state) => ({
      ...state,
      [createdSet.id]: [],
    }));

    this.setsLoaded = true;

    return createdSet;
  }

  async updateSet(
    setId: number,
    request: UpdateFlashcardSetRequest,
  ): Promise<FlashcardSetResponse> {
    const updatedSet = await firstValueFrom(
      this.flashcardApi.updateSet(setId, request),
    );

    this.upsertSet(updatedSet);

    return updatedSet;
  }

  async toggleFavorite(setId: number): Promise<void> {
    const set = this.getSet(setId);

    if (!set) {
      return;
    }

    await this.updateSet(setId, {
      title: set.title,
      description: set.description,
      folder: set.folder,
      color: set.color,
      favorite: !set.favorite,
    });
  }

  async deleteSet(setId: number): Promise<void> {
    await firstValueFrom(this.flashcardApi.deleteSet(setId));

    this.setsState.update((sets) => sets.filter((set) => set.id !== setId));

    this.cardsBySetState.update((state) => {
      const updatedState = { ...state };

      delete updatedState[setId];

      return updatedState;
    });
  }

  async loadCards(setId: number, force = false): Promise<FlashcardResponse[]> {
    const existingCards = this.cardsBySetState()[setId];

    if (existingCards && !force) {
      return existingCards;
    }

    this.setCardLoading(setId, true);

    try {
      const cards = await firstValueFrom(this.flashcardApi.getCards(setId));

      this.cardsBySetState.update((state) => ({
        ...state,
        [setId]: cards,
      }));

      this.updateCardCount(setId, cards.length);

      return cards;
    } finally {
      this.setCardLoading(setId, false);
    }
  }

  async createCard(
    setId: number,
    request: CreateFlashcardRequest,
  ): Promise<FlashcardResponse> {
    const createdCard = await firstValueFrom(
      this.flashcardApi.createCard(setId, request),
    );

    this.cardsBySetState.update((state) => {
      const currentCards = state[setId] ?? [];

      return {
        ...state,
        [setId]: [...currentCards, createdCard],
      };
    });

    this.updateCardCount(setId, this.cardsForSet(setId).length);

    return createdCard;
  }

  async updateCard(
    setId: number,
    cardId: number,
    request: UpdateFlashcardRequest,
  ): Promise<FlashcardResponse> {
    const updatedCard = await firstValueFrom(
      this.flashcardApi.updateCard(setId, cardId, request),
    );

    this.cardsBySetState.update((state) => ({
      ...state,
      [setId]: (state[setId] ?? []).map((card) =>
        card.id === cardId ? updatedCard : card,
      ),
    }));

    return updatedCard;
  }

  async deleteCard(setId: number, cardId: number): Promise<void> {
    await firstValueFrom(this.flashcardApi.deleteCard(setId, cardId));

    this.cardsBySetState.update((state) => ({
      ...state,
      [setId]: (state[setId] ?? []).filter((card) => card.id !== cardId),
    }));

    this.updateCardCount(setId, this.cardsForSet(setId).length);
  }

  updateProgress(setId: number, progress: number): void {
    this.setsState.update((sets) =>
      sets.map((set) =>
        set.id === setId
          ? {
              ...set,
              progress,
              updatedAt: new Date().toISOString(),
            }
          : set,
      ),
    );
  }

  clear(): void {
    this.setsState.set([]);
    this.cardsBySetState.set({});
    this.loadingSetsState.set(false);
    this.loadingCardsState.set({});
    this.errorState.set('');
    this.setsLoaded = false;
  }

  private upsertSet(updatedSet: FlashcardSetResponse): void {
    this.setsState.update((sets) => {
      const exists = sets.some((set) => set.id === updatedSet.id);

      if (!exists) {
        return [updatedSet, ...sets];
      }

      return sets.map((set) => (set.id === updatedSet.id ? updatedSet : set));
    });
  }

  private updateCardCount(setId: number, cardCount: number): void {
    this.setsState.update((sets) =>
      sets.map((set) =>
        set.id === setId
          ? {
              ...set,
              cardCount,
              updatedAt: new Date().toISOString(),
            }
          : set,
      ),
    );
  }

  private setCardLoading(setId: number, loading: boolean): void {
    this.loadingCardsState.update((state) => ({
      ...state,
      [setId]: loading,
    }));
  }

  private resolveError(error: unknown, fallback: string): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      error.status === 0
    ) {
      return 'Das Backend ist nicht erreichbar.';
    }

    return fallback;
  }
}
