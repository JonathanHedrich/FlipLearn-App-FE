import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { firstValueFrom } from 'rxjs';

import {
  arrowBackOutline,
  bookOutline,
  checkmarkOutline,
  chevronDownOutline,
  folderOutline,
} from 'ionicons/icons';

import {
  FlashcardSetColor,
  UpdateFlashcardSetRequest,
} from '../../../core/models/flashcard-api.model';
import { CategoryResponse } from '../../../core/models/category.model';

import { CategoryApi } from '../../../core/services/category-api';

import { FlashcardStore } from '../../../core/stores/flashcard.store';
import { TranslatePipe } from '@ngx-translate/core';

interface ColorOption {
  value: FlashcardSetColor;
  hex: string;
  label: string;
}

@Component({
  selector: 'app-edit-set',
  standalone: true,
  imports: [ReactiveFormsModule, IonContent, IonIcon, TranslatePipe],
  templateUrl: './edit-set.page.html',
  styleUrls: ['./edit-set.page.scss'],
})
export class EditSetPage {
  readonly setId: number;

  isLoading = true;
  isSubmitting = false;
  isLoadingCategories = false;

  loadError = '';
  saveError = '';
  categoryError = '';

  categories: CategoryResponse[] = [];

  selectedColor: FlashcardSetColor = 'blue';
  favorite = false;

  readonly colorOptions: ColorOption[] = [
    {
      value: 'blue',
      hex: '#2868f7',
      label: 'Blau',
    },
    {
      value: 'purple',
      hex: '#8735ef',
      label: 'Violett',
    },
    {
      value: 'green',
      hex: '#069f78',
      label: 'Grün',
    },
    {
      value: 'orange',
      hex: '#e88100',
      label: 'Orange',
    },
    {
      value: 'red',
      hex: '#e92929',
      label: 'Rot',
    },
    {
      value: 'cyan',
      hex: '#1495b5',
      label: 'Türkis',
    },
  ];

  readonly editSetForm = this.formBuilder.group({
    title: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
    ]),

    description: this.formBuilder.nonNullable.control('', [
      Validators.maxLength(500),
    ]),

    /*
     * null bedeutet: keine Kategorie.
     *
     * Hier darf nonNullable nicht verwendet werden,
     * da categoryId bewusst null sein kann.
     */
    categoryId: this.formBuilder.control<number | null>(null),
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly flashcardStore: FlashcardStore,
    private readonly categoryApi: CategoryApi,
  ) {
    this.setId = Number(this.route.snapshot.paramMap.get('setId')) || 0;

    addIcons({
      arrowBackOutline,
      bookOutline,
      checkmarkOutline,
      chevronDownOutline,
      folderOutline,
    });
  }

  async ionViewWillEnter(): Promise<void> {
    await this.loadCategories();
    await this.loadSet();
  }

  get titleInvalid(): boolean {
    const control = this.editSetForm.controls.title;

    return control.invalid && control.touched;
  }

  async loadCategories(): Promise<void> {
    if (this.isLoadingCategories) {
      return;
    }

    this.isLoadingCategories = true;
    this.categoryError = '';

    try {
      this.categories = await firstValueFrom(this.categoryApi.getCategories());
    } catch (error: unknown) {
      this.categoryError = this.resolveError(
        error,
        'Die Kategorien konnten nicht geladen werden.',
      );
    } finally {
      this.isLoadingCategories = false;
    }
  }

  async loadSet(): Promise<void> {
    if (!this.setId) {
      this.loadError = 'Die Lernset-ID ist ungültig.';
      this.isLoading = false;

      return;
    }

    this.isLoading = true;
    this.loadError = '';

    try {
      const set = await this.flashcardStore.loadSet(this.setId, true);

      this.editSetForm.patchValue({
        title: set.title,
        description: set.description ?? '',
        categoryId: set.categoryId ?? null,
      });

      this.selectedColor = set.color;
      this.favorite = set.favorite;
    } catch (error: unknown) {
      this.loadError = this.resolveError(
        error,
        'Das Lernset konnte nicht geladen werden.',
      );
    } finally {
      this.isLoading = false;
    }
  }

  selectColor(color: FlashcardSetColor): void {
    this.selectedColor = color;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigate(['/sets', this.setId, 'edit']);
  }

  async saveSet(): Promise<void> {
    this.editSetForm.markAllAsTouched();
    this.saveError = '';

    if (this.editSetForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.editSetForm.getRawValue();

      const request: UpdateFlashcardSetRequest = {
        title: formValue.title.trim(),

        description: formValue.description.trim() || null,

        categoryId: formValue.categoryId,

        color: this.selectedColor,

        favorite: this.favorite,
      };

      await this.flashcardStore.updateSet(this.setId, request);

      this.location.back();
    } catch (error: unknown) {
      this.saveError = this.resolveError(
        error,
        'Das Lernset konnte nicht gespeichert werden.',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  private resolveError(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (error.status === 0) {
      return 'Das Backend ist nicht erreichbar.';
    }

    if (
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return fallback;
  }
}
