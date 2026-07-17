import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  bookOutline,
  checkmarkOutline,
  chevronDownOutline,
  folderOutline,
} from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

import {
  CreateFlashcardSetRequest,
  FlashcardSetColor,
} from '../../../core/models/flashcard-api.model';
import { CategoryResponse } from '../../../core/models/category.model';

import { CategoryApi } from '../../../core/services/category-api';
import { FlashcardStore } from '../../../core/stores/flashcard.store';

import { FlButtonComponent } from '../../../shared/components/fl-button/fl-button.component';

interface ColorOption {
  value: FlashcardSetColor;
  hex: string;
  labelKey: string;
}

@Component({
  selector: 'app-create-set',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonIcon,
    FlButtonComponent,
    TranslatePipe,
  ],
  templateUrl: './create-set.page.html',
  styleUrls: ['./create-set.page.scss'],
})
export class CreateSetPage {
  submitted = false;
  isSubmitting = false;
  isLoadingCategories = false;

  createError = '';
  categoryError = '';

  categories: CategoryResponse[] = [];

  selectedColor: FlashcardSetColor = 'blue';

  readonly colorOptions: ColorOption[] = [
    {
      value: 'blue',
      hex: '#2868f7',
      labelKey: 'createSet.colors.blue',
    },
    {
      value: 'purple',
      hex: '#8735ef',
      labelKey: 'createSet.colors.purple',
    },
    {
      value: 'green',
      hex: '#069f78',
      labelKey: 'createSet.colors.green',
    },
    {
      value: 'orange',
      hex: '#e88100',
      labelKey: 'createSet.colors.orange',
    },
    {
      value: 'red',
      hex: '#e92929',
      labelKey: 'createSet.colors.red',
    },
    {
      value: 'cyan',
      hex: '#1495b5',
      labelKey: 'createSet.colors.cyan',
    },
  ];

  readonly createSetForm = this.formBuilder.group({
    title: this.formBuilder.nonNullable.control('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(100),
    ]),

    description: this.formBuilder.nonNullable.control('', [
      Validators.maxLength(500),
    ]),

    categoryId: this.formBuilder.control<number | null>(null),
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly flashcardStore: FlashcardStore,
    private readonly categoryApi: CategoryApi,
    private readonly translate: TranslateService,
  ) {
    addIcons({
      arrowBackOutline,
      bookOutline,
      checkmarkOutline,
      chevronDownOutline,
      folderOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.loadCategories();
  }

  get titleInvalid(): boolean {
    const control = this.createSetForm.controls.title;

    return control.invalid && (control.touched || this.submitted);
  }

  get previewTitle(): string {
    return (
      this.createSetForm.controls.title.value.trim() ||
      this.translate.instant('createSet.preview.defaultTitle')
    );
  }

  get selectedColorHex(): string {
    return (
      this.colorOptions.find((option) => option.value === this.selectedColor)
        ?.hex ?? '#2868f7'
    );
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
      this.categoryError = this.resolveCategoryLoadError(error);
    } finally {
      this.isLoadingCategories = false;
    }
  }

  selectColor(color: FlashcardSetColor): void {
    this.selectedColor = color;
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    void this.router.navigateByUrl('/sets');
  }

  async createSet(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.submitted = true;
    this.createError = '';

    this.createSetForm.markAllAsTouched();

    if (this.createSetForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.createSetForm.getRawValue();

      const request: CreateFlashcardSetRequest = {
        title: formValue.title.trim(),
        description: formValue.description.trim() || null,
        categoryId: formValue.categoryId,
        color: this.selectedColor,
      };

      const createdSet = await this.flashcardStore.createSet(request);

      await this.router.navigate(['/sets', createdSet.id, 'edit'], {
        replaceUrl: true,
      });
    } catch (error: unknown) {
      this.createError = this.resolveCreateError(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private resolveCategoryLoadError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return this.translate.instant('createSet.errors.categoriesLoadFailed');
    }

    if (error.status === 0) {
      return this.translate.instant('createSet.errors.backendUnavailable');
    }

    if (error.status === 401) {
      return this.translate.instant('createSet.errors.sessionExpired');
    }

    if (
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return this.translate.instant('createSet.errors.categoriesLoadFailed');
  }

  private resolveCreateError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return this.translate.instant('createSet.errors.unknown');
    }

    if (error.status === 0) {
      return this.translate.instant('createSet.errors.backendUnavailable');
    }

    if (error.status === 401) {
      return this.translate.instant('createSet.errors.sessionExpired');
    }

    if (error.status === 400) {
      const validationErrors = this.extractValidationErrors(error.error);

      if (validationErrors.length > 0) {
        return validationErrors[0];
      }

      return this.translate.instant('createSet.errors.invalidData');
    }

    if (
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return this.translate.instant('createSet.errors.createFailed');
  }

  private extractValidationErrors(responseBody: unknown): string[] {
    if (
      typeof responseBody !== 'object' ||
      responseBody === null ||
      !('validationErrors' in responseBody)
    ) {
      return [];
    }

    const validationErrors = responseBody.validationErrors;

    if (typeof validationErrors !== 'object' || validationErrors === null) {
      return [];
    }

    return Object.values(validationErrors).filter(
      (message): message is string => typeof message === 'string',
    );
  }
}
