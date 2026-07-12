import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
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
  FlashcardSet,
  FlashcardSetColor,
} from '../../../core/models/flashcard.model';
import { FlashcardStore } from '../../../core/services/flashcard-store';
import { FlBottomNavComponent } from '../../../shared/components/fl-bottom-nav/fl-bottom-nav.component';

type MainFilter = 'all' | 'favorites' | 'recent';

@Component({
  selector: 'app-flashcard-list',
  standalone: true,
  imports: [NgClass, FormsModule, IonContent, IonIcon, FlBottomNavComponent],
  templateUrl: './flashcard-list.page.html',
  styleUrls: ['./flashcard-list.page.scss'],
})
export class FlashcardListPage {
  searchTerm = '';

  readonly activeFilter = signal<MainFilter>('all');
  readonly activeCategory = signal<string>('all');

  readonly filteredSets = computed(() => {
    const query = this.searchTerm.trim().toLowerCase();

    const selectedFilter = this.activeFilter();
    const selectedCategory = this.activeCategory();

    return this.flashcardStore
      .sets()
      .filter((set) => {
        const matchesSearch =
          query.length === 0 ||
          set.title.toLowerCase().includes(query) ||
          set.description.toLowerCase().includes(query);

        const matchesFilter =
          selectedFilter === 'all' ||
          (selectedFilter === 'favorites' && set.favorite) ||
          selectedFilter === 'recent';

        const matchesCategory =
          selectedCategory === 'all' || set.folder === selectedCategory;

        return matchesSearch && matchesFilter && matchesCategory;
      })
      .sort((firstSet, secondSet) => {
        if (selectedFilter !== 'recent') {
          return 0;
        }

        return (
          new Date(secondSet.updatedAt).getTime() -
          new Date(firstSet.updatedAt).getTime()
        );
      });
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

  setMainFilter(filter: MainFilter): void {
    this.activeFilter.set(filter);
  }

  setCategory(category: string): void {
    this.activeCategory.set(category);
  }

  getThemeClass(color: FlashcardSetColor): string {
    return `theme-${color}`;
  }

  toggleFavorite(set: FlashcardSet, event: Event): void {
    event.stopPropagation();

    this.flashcardStore.toggleFavorite(set.id);
  }

  openCreateSet(): void {
    void this.router.navigateByUrl('/sets/create');
  }

  openEditor(setId: number, event?: Event): void {
    event?.stopPropagation();

    void this.router.navigate(['/sets', setId, 'edit']);
  }

  startStudy(setId: number, event: Event): void {
    event.stopPropagation();

    const set = this.flashcardStore.getSetById(setId);

    if (!set || set.cards.length === 0) {
      window.alert('Füge zuerst mindestens eine Lernkarte hinzu.');

      void this.router.navigate(['/sets', setId, 'edit']);

      return;
    }

    void this.router.navigate(['/study', setId]);
  }

  deleteSet(setId: number, event: Event): void {
    event.stopPropagation();

    const set = this.flashcardStore.getSetById(setId);

    if (!set) {
      return;
    }

    const confirmed = window.confirm(
      `Möchtest du „${set.title}“ und alle enthaltenen Karten wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    this.flashcardStore.deleteSet(setId);
  }
}
