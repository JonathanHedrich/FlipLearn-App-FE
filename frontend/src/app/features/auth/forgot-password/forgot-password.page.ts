import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkCircleOutline,
  mailOutline,
} from 'ionicons/icons';

import { FlButtonComponent } from '../../../shared/components/fl-button/fl-button.component';
import { FlInputComponent } from '../../../shared/components/fl-input/fl-input.component';
import { FlLogoComponent } from '../../../shared/components/fl-logo/fl-logo.component';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    IonIcon,
    FlButtonComponent,
    FlInputComponent,
    FlLogoComponent,
  ],
})
export class ForgotPasswordPage {
  submitted = false;
  isSubmitting = false;
  emailSent = false;

  readonly forgotPasswordForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
  ) {
    addIcons({
      arrowBackOutline,
      checkmarkCircleOutline,
      mailOutline,
    });
  }

  get emailInvalid(): boolean {
    const control = this.forgotPasswordForm.controls.email;

    return control.invalid && (control.touched || this.submitted);
  }

  async submitRequest(): Promise<void> {
    this.submitted = true;
    this.forgotPasswordForm.markAllAsTouched();

    if (this.forgotPasswordForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      /*
       * Später wird hier das Spring-Boot-Backend aufgerufen.
       * Aktuell simulieren wir nur den Versand.
       */
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 700);
      });

      this.emailSent = true;
    } finally {
      this.isSubmitting = false;
    }
  }

  async goToLogin(): Promise<void> {
    await this.router.navigateByUrl('/login', {
      replaceUrl: true,
    });
  }
}
