import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
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
  FlashcardSetColor,
  FlashcardSetResponse,
} from '../../../core/models/flashcard-api.model';
import { FlashcardApi } from '../../../core/services/flashcard-api';
import { FlBottomNavComponent } from '../../../shared/components/fl-bottom-nav/fl-bottom-nav.component';

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

  readonly sets = signal<FlashcardSetResponse[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal('');

  readonly activeFilter = signal<MainFilter>('all');
  readonly activeCategory = signal('all');

  readonly totalCards = computed(() =>
    this.sets().reduce((total, set) => total + set.cardCount, 0),
  );

  readonly filteredSets = computed(() => {
    const query = this.searchTerm.trim().toLowerCase();

    const filter = this.activeFilter();
    const category = this.activeCategory();

    let result = this.sets().filter((set) => {
      const matchesSearch =
        query.length === 0 ||
        set.title.toLowerCase().includes(query) ||
        (set.description ?? '').toLowerCase().includes(query);

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
    private readonly flashcardApi: FlashcardApi,
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
    void this.loadSets();
  }

  async loadSets(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set('');

    try {
      const sets = await firstValueFrom(this.flashcardApi.getSets());

      this.sets.set(sets);
    } catch (error: unknown) {
      this.loadError.set(this.resolveLoadError(error));
    } finally {
      this.isLoading.set(false);
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
      const updatedSet = await firstValueFrom(
        this.flashcardApi.updateSet(set.id, {
          title: set.title,
          description: set.description,
          folder: set.folder,
          color: set.color,
          favorite: !set.favorite,
        }),
      );

      this.replaceSet(updatedSet);
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
      `Möchtest du „${set.title}“ wirklich löschen?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await firstValueFrom(this.flashcardApi.deleteSet(set.id));

      this.sets.update((sets) =>
        sets.filter((existingSet) => existingSet.id !== set.id),
      );
    } catch {
      window.alert('Das Lernset konnte nicht gelöscht werden.');
    }
  }

  private replaceSet(updatedSet: FlashcardSetResponse): void {
    this.sets.update((sets) =>
      sets.map((set) => (set.id === updatedSet.id ? updatedSet : set)),
    );
  }

  private resolveLoadError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Das Backend ist nicht erreichbar.';
    }

    return 'Die Lernsets konnten nicht geladen werden.';
  }
}
