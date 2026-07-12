import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  bookOutline,
  checkmarkOutline,
  chevronDownOutline,
  folderOutline,
} from 'ionicons/icons';

import { FlButtonComponent } from '../../../shared/components/fl-button/fl-button.component';

type SetColor = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'cyan';

interface ColorOption {
  value: SetColor;
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
  selectedColor: SetColor = 'blue';

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
      [Validators.required, Validators.minLength(2), Validators.maxLength(60)],
    ],
    description: ['', [Validators.maxLength(250)]],
    folder: [''],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
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

  selectColor(color: SetColor): void {
    this.selectedColor = color;
  }

  goBack(): void {
    void this.router.navigateByUrl('/sets');
  }

  async createSet(): Promise<void> {
    this.submitted = true;
    this.createSetForm.markAllAsTouched();

    if (this.createSetForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      const newSet = {
        ...this.createSetForm.getRawValue(),
        color: this.selectedColor,
      };

      console.log('Neues Lernset:', newSet);

      /*
       * Später:
       * POST /api/sets
       */

      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 700);
      });

      await this.router.navigate(['/sets', 1, 'edit'], {
        replaceUrl: true,
      });
    } finally {
      this.isSubmitting = false;
    }
  }
}
