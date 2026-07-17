import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  addOutline,
  closeOutline,
  createOutline,
  folderOutline,
  heartOutline,
  heartSharp,
  pencilOutline,
  searchOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import {
  FlashcardSetColor,
  FlashcardSetResponse,
} from '../../../core/models/flashcard-api.model';
import { CategoryResponse } from '../../../core/models/category.model';

import { AppNotificationService } from '../../../core/services/app-notification.service';
import { CategoryApi } from '../../../core/services/category-api';

import { FlashcardStore } from '../../../core/stores/flashcard.store';

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
    TranslatePipe,
  ],
  templateUrl: './flashcard-list.page.html',
  styleUrls: ['./flashcard-list.page.scss'],
})
export class FlashcardListPage {
  searchTerm = '';

  categories: CategoryResponse[] = [];

  categoryMenuOpen = false;

  editingCategory: CategoryResponse | null = null;

  categoryName = '';

  categoryError = '';

  categoriesExpanded = false;

  isLoadingCategories = false;

  isSavingCategory = false;

  deletingCategoryId: number | null = null;

  readonly activeFilter = signal<MainFilter>('all');

  /*
   * Intern wird weiterhin der technische Wert "all"
   * verwendet. Nur die sichtbare Beschriftung wird übersetzt.
   */
  readonly activeCategory = signal<string>('all');

  readonly sets = this.flashcardStore.sets;

  readonly isLoading = this.flashcardStore.isLoadingSets;

  readonly loadError = this.flashcardStore.error;

  readonly totalCards = this.flashcardStore.totalCards;

  readonly filteredSets = computed(() => {
    const query = this.searchTerm.trim().toLocaleLowerCase();

    const filter = this.activeFilter();
    const category = this.activeCategory();

    let result = this.sets().filter((set) => {
      const title = set.title.toLocaleLowerCase();

      const description = (set.description ?? '').toLocaleLowerCase();

      const matchesSearch =
        query.length === 0 ||
        title.includes(query) ||
        description.includes(query);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'favorites' && set.favorite) ||
        filter === 'recent';

      const setCategory = (set.categoryName ?? '').trim();

      const matchesCategory =
        category === 'all' ||
        setCategory.localeCompare(category, undefined, {
          sensitivity: 'accent',
        }) === 0;

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
    private readonly appNotificationService: AppNotificationService,
    private readonly categoryApi: CategoryApi,
    private readonly translate: TranslateService,
  ) {
    addIcons({
      addOutline,
      closeOutline,
      createOutline,
      folderOutline,
      heartOutline,
      heartSharp,
      pencilOutline,
      searchOutline,
      timeOutline,
      trashOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.reloadPageData();
  }

  async reloadPageData(): Promise<void> {
    await Promise.all([this.reloadSets(), this.loadCategories()]);
  }

  async loadSets(): Promise<void> {
    try {
      await this.flashcardStore.loadSets();
    } catch {
      /*
       * Der Store speichert den Fehler selbst.
       */
    }
  }

  async reloadSets(): Promise<void> {
    try {
      await this.flashcardStore.loadSets(true);
    } catch {
      /*
       * Der Fehler wird über loadError angezeigt.
       */
    }
  }

  async loadCategories(): Promise<void> {
    if (this.isLoadingCategories) {
      return;
    }

    this.isLoadingCategories = true;
    this.categoryError = '';

    try {
      this.categories = await firstValueFrom(this.categoryApi.getCategories());

      /*
       * Falls eine ausgewählte Kategorie extern
       * gelöscht wurde, springen wir auf "all".
       */
      const selectedCategory = this.activeCategory();

      if (
        selectedCategory !== 'all' &&
        !this.categories.some((category) => category.name === selectedCategory)
      ) {
        this.activeCategory.set('all');
      }
    } catch (error: unknown) {
      this.categoryError = this.resolveCategoryError(
        error,
        'sets.errors.categoriesLoadFailed',
      );
    } finally {
      this.isLoadingCategories = false;
    }
  }

  setMainFilter(filter: MainFilter): void {
    this.activeFilter.set(filter);
  }

  setCategory(categoryName: string): void {
    this.activeCategory.set(categoryName);
  }

  getThemeClass(color: FlashcardSetColor): string {
    return `theme-${color}`;
  }

  async toggleFavorite(set: FlashcardSetResponse, event: Event): Promise<void> {
    event.stopPropagation();

    try {
      await this.flashcardStore.toggleFavorite(set.id);
    } catch {
      window.alert(this.translate.instant('sets.errors.favoriteSaveFailed'));
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
      window.alert(this.translate.instant('sets.errors.noCards'));

      this.openEditor(set.id);
      return;
    }

    void this.router.navigate(['/study', set.id]);
  }

  async deleteSet(set: FlashcardSetResponse, event: Event): Promise<void> {
    event.stopPropagation();

    const confirmed = window.confirm(
      this.translate.instant('sets.confirmations.deleteSet', {
        title: set.title,
      }),
    );

    if (!confirmed) {
      return;
    }

    try {
      await this.flashcardStore.deleteSet(set.id);

      this.appNotificationService.rebuildNotifications();
    } catch {
      window.alert(this.translate.instant('sets.errors.deleteSetFailed'));
    }
  }

  openCategoryManager(): void {
    this.categoryError = '';
    this.categoryName = '';
    this.editingCategory = null;
    this.categoryMenuOpen = true;
  }

  closeCategoryManager(): void {
    if (this.isSavingCategory || this.deletingCategoryId !== null) {
      return;
    }

    this.categoryMenuOpen = false;
    this.categoryName = '';
    this.editingCategory = null;
    this.categoryError = '';
  }

  startCreateCategory(): void {
    this.editingCategory = null;
    this.categoryName = '';
    this.categoryError = '';
  }

  startRenameCategory(category: CategoryResponse): void {
    this.editingCategory = category;
    this.categoryName = category.name;
    this.categoryError = '';
  }

  cancelCategoryEdit(): void {
    this.editingCategory = null;
    this.categoryName = '';
    this.categoryError = '';
  }

  async saveCategory(): Promise<void> {
    if (this.isSavingCategory) {
      return;
    }

    const name = this.categoryName.trim();

    this.categoryError = '';

    if (!name) {
      this.categoryError = this.translate.instant(
        'sets.categoryManager.errors.nameRequired',
      );

      return;
    }

    if (name.length > 80) {
      this.categoryError = this.translate.instant(
        'sets.categoryManager.errors.nameTooLong',
        {
          max: 80,
        },
      );

      return;
    }

    this.isSavingCategory = true;

    try {
      if (this.editingCategory) {
        const previousName = this.editingCategory.name;

        const updatedCategory = await firstValueFrom(
          this.categoryApi.updateCategory(this.editingCategory.id, {
            name,
          }),
        );

        this.categories = this.categories
          .map((category) =>
            category.id === updatedCategory.id ? updatedCategory : category,
          )
          .sort((first, second) =>
            this.compareCategoryNames(first.name, second.name),
          );

        if (this.activeCategory() === previousName) {
          this.activeCategory.set(updatedCategory.name);
        }
      } else {
        const createdCategory = await firstValueFrom(
          this.categoryApi.createCategory({
            name,
          }),
        );

        this.categories = [...this.categories, createdCategory].sort(
          (first, second) => this.compareCategoryNames(first.name, second.name),
        );
      }

      this.categoryName = '';
      this.editingCategory = null;
    } catch (error: unknown) {
      this.categoryError = this.resolveCategoryError(
        error,
        this.editingCategory
          ? 'sets.categoryManager.errors.renameFailed'
          : 'sets.categoryManager.errors.createFailed',
      );
    } finally {
      this.isSavingCategory = false;
    }
  }

  async deleteCategory(category: CategoryResponse): Promise<void> {
    if (this.deletingCategoryId !== null || this.isSavingCategory) {
      return;
    }

    const confirmed = window.confirm(
      this.translate.instant('sets.confirmations.deleteCategory', {
        name: category.name,
      }),
    );

    if (!confirmed) {
      return;
    }

    this.deletingCategoryId = category.id;
    this.categoryError = '';

    try {
      await firstValueFrom(this.categoryApi.deleteCategory(category.id));

      this.categories = this.categories.filter(
        (existingCategory) => existingCategory.id !== category.id,
      );

      if (this.activeCategory() === category.name) {
        this.activeCategory.set('all');
      }

      if (this.editingCategory?.id === category.id) {
        this.cancelCategoryEdit();
      }

      /*
       * Sets neu laden, weil das Backend die
       * Kategorie-Zuordnung beim Löschen entfernt.
       */
      await this.reloadSets();
    } catch (error: unknown) {
      this.categoryError = this.resolveCategoryError(
        error,
        'sets.categoryManager.errors.deleteFailed',
      );
    } finally {
      this.deletingCategoryId = null;
    }
  }

  trackCategory(_index: number, category: CategoryResponse): number {
    return category.id;
  }

  private compareCategoryNames(first: string, second: string): number {
    const language = this.translate.currentLang() ?? 'de';

    return first.localeCompare(second, language, {
      sensitivity: 'base',
    });
  }

  private resolveCategoryError(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return this.translate.instant(fallbackKey);
    }

    if (error.status === 0) {
      return this.translate.instant('sets.errors.backendUnavailable');
    }

    if (error.status === 401) {
      return this.translate.instant('sets.errors.sessionExpired');
    }

    if (error.status === 409) {
      return this.translate.instant(
        'sets.categoryManager.errors.alreadyExists',
      );
    }

    if (
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return this.translate.instant(fallbackKey);
  }
}
