import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';

import { FlButtonComponent } from '../../../shared/components/fl-button/fl-button.component';
import { FlashcardStore } from '../../../core/stores/flashcard.store';

import {
  arrowBackOutline,
  bookOutline,
  checkmarkOutline,
  chevronDownOutline,
  folderOutline,
} from 'ionicons/icons';

import {
  CreateFlashcardSetRequest,
  FlashcardSetColor,
} from '../../../core/models/flashcard-api.model';

interface ColorOption {
  value: FlashcardSetColor;
  hex: string;
  label: string;
}

@Component({
  selector: 'app-create-set',
  standalone: true,
  imports: [ReactiveFormsModule, IonContent, IonIcon, FlButtonComponent],
  templateUrl: './create-set.page.html',
  styleUrls: ['./create-set.page.scss'],
})
export class CreateSetPage {
  submitted = false;
  isSubmitting = false;
  createError = '';

  selectedColor: FlashcardSetColor = 'blue';

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

  readonly createSetForm = this.formBuilder.nonNullable.group({
    title: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    description: ['', [Validators.maxLength(500)]],
    folder: [''],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly flashcardStore: FlashcardStore,
  ) {
    addIcons({
      arrowBackOutline,
      bookOutline,
      checkmarkOutline,
      chevronDownOutline,
      folderOutline,
    });
  }

  get titleInvalid(): boolean {
    const control = this.createSetForm.controls.title;

    return control.invalid && (control.touched || this.submitted);
  }

  get previewTitle(): string {
    const title = this.createSetForm.controls.title.value.trim();

    return title || 'Set Title';
  }

  get selectedColorHex(): string {
    return (
      this.colorOptions.find((option) => option.value === this.selectedColor)
        ?.hex ?? '#2868f7'
    );
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
        folder: formValue.folder.trim() || null,
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

  private resolveCreateError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Beim Erstellen des Lernsets ist ein unbekannter Fehler aufgetreten.';
    }

    if (error.status === 0) {
      return 'Das Backend ist nicht erreichbar.';
    }

    if (error.status === 401) {
      return 'Deine Anmeldung ist abgelaufen. Bitte melde dich erneut an.';
    }

    if (error.status === 400) {
      const validationErrors = error.error?.validationErrors as
        | Record<string, string>
        | undefined;

      return validationErrors
        ? Object.values(validationErrors)[0]
        : 'Die eingegebenen Daten sind ungültig.';
    }

    return error.error?.message ?? 'Das Lernset konnte nicht erstellt werden.';
  }
}
