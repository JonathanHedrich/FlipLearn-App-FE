import { computed, effect, Injectable, signal } from '@angular/core';

import {
  CreateFlashcardSetInput,
  Flashcard,
  FlashcardSet,
} from '../models/flashcard.model';

const STORAGE_KEY = 'fliplearn.flashcardSets';

@Injectable({
  providedIn: 'root',
})
export class FlashcardStore {
  private readonly setsState = signal<FlashcardSet[]>(this.loadInitialSets());

  readonly sets = this.setsState.asReadonly();

  readonly totalSets = computed(() => this.setsState().length);

  readonly totalCards = computed(() =>
    this.setsState().reduce((total, set) => total + set.cards.length, 0),
  );

  constructor() {
    effect(() => {
      this.saveToStorage(this.setsState());
    });
  }

  getSetById(setId: number): FlashcardSet | undefined {
    return this.setsState().find((set) => set.id === setId);
  }

  createSet(input: CreateFlashcardSetInput): FlashcardSet {
    const now = new Date().toISOString();

    const newSet: FlashcardSet = {
      id: this.createId(),
      title: input.title.trim(),
      description: input.description.trim(),
      folder: input.folder,
      color: input.color,
      favorite: false,
      progress: 0,
      createdAt: now,
      updatedAt: now,
      cards: [],
    };

    this.setsState.update((sets) => [newSet, ...sets]);

    return newSet;
  }

  updateSet(
    setId: number,
    changes: Partial<
      Pick<
        FlashcardSet,
        'title' | 'description' | 'folder' | 'color' | 'favorite' | 'progress'
      >
    >,
  ): void {
    this.setsState.update((sets) =>
      sets.map((set) =>
        set.id === setId
          ? {
              ...set,
              ...changes,
              updatedAt: new Date().toISOString(),
            }
          : set,
      ),
    );
  }

  deleteSet(setId: number): void {
    this.setsState.update((sets) => sets.filter((set) => set.id !== setId));
  }

  toggleFavorite(setId: number): void {
    const set = this.getSetById(setId);

    if (!set) {
      return;
    }

    this.updateSet(setId, {
      favorite: !set.favorite,
    });
  }

  addCard(setId: number, front = '', back = ''): Flashcard | undefined {
    const targetSet = this.getSetById(setId);

    if (!targetSet) {
      return undefined;
    }

    const now = new Date().toISOString();

    const newCard: Flashcard = {
      id: this.createId(),
      front,
      back,
      favorite: false,
      createdAt: now,
      updatedAt: now,
    };

    this.setsState.update((sets) =>
      sets.map((set) =>
        set.id === setId
          ? {
              ...set,
              cards: [...set.cards, newCard],
              updatedAt: now,
            }
          : set,
      ),
    );

    return newCard;
  }

  updateCard(
    setId: number,
    cardId: number,
    changes: Partial<Pick<Flashcard, 'front' | 'back' | 'favorite'>>,
  ): void {
    const now = new Date().toISOString();

    this.setsState.update((sets) =>
      sets.map((set) =>
        set.id === setId
          ? {
              ...set,
              updatedAt: now,
              cards: set.cards.map((card) =>
                card.id === cardId
                  ? {
                      ...card,
                      ...changes,
                      updatedAt: now,
                    }
                  : card,
              ),
            }
          : set,
      ),
    );
  }

  deleteCard(setId: number, cardId: number): void {
    const now = new Date().toISOString();

    this.setsState.update((sets) =>
      sets.map((set) =>
        set.id === setId
          ? {
              ...set,
              updatedAt: now,
              cards: set.cards.filter((card) => card.id !== cardId),
            }
          : set,
      ),
    );
  }

  private loadInitialSets(): FlashcardSet[] {
    try {
      const storedValue = localStorage.getItem(STORAGE_KEY);

      if (!storedValue) {
        return this.createDemoSets();
      }

      const parsedValue: unknown = JSON.parse(storedValue);

      if (!Array.isArray(parsedValue)) {
        return this.createDemoSets();
      }

      return parsedValue as FlashcardSet[];
    } catch {
      return this.createDemoSets();
    }
  }

  private saveToStorage(sets: FlashcardSet[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  }

  private createId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  private createDemoSets(): FlashcardSet[] {
    const now = new Date().toISOString();

    return [
      {
        id: 1,
        title: 'Spanish Vocabulary',
        description: 'Basic Spanish words',
        folder: 'languages',
        color: 'blue',
        favorite: true,
        progress: 72,
        createdAt: now,
        updatedAt: now,
        cards: [
          {
            id: 101,
            front: 'Hello',
            back: 'Hola',
            favorite: false,
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ];
  }
}
