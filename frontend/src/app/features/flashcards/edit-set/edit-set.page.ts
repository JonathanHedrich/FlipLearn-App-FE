import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';

import { FlashcardStore } from '../../../core/stores/flashcard.store';
import { Location } from '@angular/common';

import {
  arrowBackOutline,
  bookOutline,
  checkmarkOutline,
  folderOutline,
} from 'ionicons/icons';

import {
  FlashcardSetColor,
  UpdateFlashcardSetRequest,
} from '../../../core/models/flashcard-api.model';

interface ColorOption {
  value: FlashcardSetColor;
  hex: string;
  label: string;
}

@Component({
  selector: 'app-edit-set',
  standalone: true,
  imports: [ReactiveFormsModule, IonContent, IonIcon],
  templateUrl: './edit-set.page.html',
  styleUrls: ['./edit-set.page.scss'],
})
export class EditSetPage {
  readonly setId: number;

  isLoading = true;
  isSubmitting = false;
  loadError = '';
  saveError = '';

  selectedColor: FlashcardSetColor = 'blue';
  favorite = false;

  readonly colorOptions: ColorOption[] = [
    { value: 'blue', hex: '#2868f7', label: 'Blau' },
    { value: 'purple', hex: '#8735ef', label: 'Violett' },
    { value: 'green', hex: '#069f78', label: 'Grün' },
    { value: 'orange', hex: '#e88100', label: 'Orange' },
    { value: 'red', hex: '#e92929', label: 'Rot' },
    { value: 'cyan', hex: '#1495b5', label: 'Türkis' },
  ];

  readonly editSetForm = this.formBuilder.nonNullable.group({
    title: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    description: ['', [Validators.maxLength(500)]],
    folder: ['', [Validators.maxLength(100)]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly location: Location,
    private readonly flashcardStore: FlashcardStore,
  ) {
    this.setId = Number(this.route.snapshot.paramMap.get('setId')) || 0;

    addIcons({
      arrowBackOutline,
      bookOutline,
      checkmarkOutline,
      folderOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.loadSet();
  }

  get titleInvalid(): boolean {
    const control = this.editSetForm.controls.title;

    return control.invalid && control.touched;
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

      this.editSetForm.setValue({
        title: set.title,
        description: set.description ?? '',
        folder: set.folder ?? '',
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
        folder: formValue.folder.trim() || null,
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
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'Das Backend ist nicht erreichbar.';
    }

    if (error instanceof HttpErrorResponse && error.error?.message) {
      return error.error.message as string;
    }

    return fallback;
  }
}
