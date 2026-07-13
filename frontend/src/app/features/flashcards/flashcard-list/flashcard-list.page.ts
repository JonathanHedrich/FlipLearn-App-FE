import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';

import { FlashcardStore } from '../../../core/stores/flashcard.store';
import { FlBottomNavComponent } from '../../../shared/components/fl-bottom-nav/fl-bottom-nav.component';

import {
  addOutline,
  createOutline,
  folderOutline,
  heartOutline,
  heartSharp,
  searchOutline,
  timeOutline,
} from 'ionicons/icons';

import {
  FlashcardSetColor,
  FlashcardSetResponse,
} from '../../../core/models/flashcard-api.model';

type MainFilter = 'all' | 'favorites' | 'recent';

@Component({
  selector: 'app-flashcard-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    FlBottomNavComponent,
  ],
  templateUrl: './flashcard-list.page.html',
  styleUrls: ['./flashcard-list.page.scss'],
})
export class FlashcardListPage {
  searchTerm = '';

  readonly activeFilter = signal<MainFilter>('all');

  readonly activeCategory = signal<string>('all');

  /*
   * Öffentliche Signals des zentralen Stores.
   * Diese werden im Template gelesen, aber nicht direkt verändert.
   */
  readonly sets = this.flashcardStore.sets;

  readonly isLoading = this.flashcardStore.isLoadingSets;

  readonly loadError = this.flashcardStore.error;

  readonly totalCards = this.flashcardStore.totalCards;

  readonly filteredSets = computed(() => {
    const query = this.searchTerm.trim().toLowerCase();

    const filter = this.activeFilter();
    const category = this.activeCategory();

    let result = this.sets().filter((set) => {
      const title = set.title.toLowerCase();

      const description = (set.description ?? '').toLowerCase();

      const matchesSearch =
        query.length === 0 ||
        title.includes(query) ||
        description.includes(query);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'favorites' && set.favorite) ||
        filter === 'recent';

      const matchesCategory = category === 'all' || set.folder === category;

      return matchesSearch && matchesFilter && matchesCategory;
    });

    if (filter === 'recent') {
      result = [...result].sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime(),
      );
    }

    return result;
  });

  constructor(
    readonly flashcardStore: FlashcardStore,
    private readonly router: Router,
  ) {
    addIcons({
      addOutline,
      createOutline,
      folderOutline,
      heartOutline,
      heartSharp,
      searchOutline,
      timeOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.reloadSets();
  }

  async loadSets(): Promise<void> {
    try {
      await this.flashcardStore.loadSets();
    } catch {
      /*
       * Der Store speichert die Fehlermeldung bereits
       * in flashcardStore.error.
       */
    }
  }

  async reloadSets(): Promise<void> {
    try {
      await this.flashcardStore.loadSets(true);
    } catch {
      /*
       * Der Fehler wird über loadError im Template angezeigt.
       */
    }
  }

  setMainFilter(filter: MainFilter): void {
    this.activeFilter.set(filter);
  }

  setCategory(category: string): void {
    this.activeCategory.set(category);
  }

  getThemeClass(color: FlashcardSetColor): string {
    return `theme-${color}`;
  }

  async toggleFavorite(set: FlashcardSetResponse, event: Event): Promise<void> {
    event.stopPropagation();

    try {
      await this.flashcardStore.toggleFavorite(set.id);
    } catch {
      window.alert('Der Favoritenstatus konnte nicht gespeichert werden.');
    }
  }

  openCreateSet(): void {
    void this.router.navigateByUrl('/sets/create');
  }

  openEditor(setId: number, event?: Event): void {
    event?.stopPropagation();

    void this.router.navigate(['/sets', setId, 'edit']);
  }

  startStudy(set: FlashcardSetResponse, event: Event): void {
    event.stopPropagation();

    if (set.cardCount === 0) {
      window.alert('Füge zuerst mindestens eine Lernkarte hinzu.');

      this.openEditor(set.id);
      return;
    }

    void this.router.navigate(['/study', set.id]);
  }

  async deleteSet(set: FlashcardSetResponse, event: Event): Promise<void> {
    event.stopPropagation();

    const confirmed = window.confirm(
      `Möchtest du „${set.title}“ und alle enthaltenen Karten wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.flashcardStore.deleteSet(set.id);
    } catch {
      window.alert('Das Lernset konnte nicht gelöscht werden.');
    }
  }
}
