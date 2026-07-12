import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { FlLogoComponent } from '../../../shared/components/fl-logo/fl-logo.component';
import { FlButtonComponent } from '../../../shared/components/fl-button/fl-button.component';
import { FlInputComponent } from '../../../shared/components/fl-input/fl-input.component';
import { FlSocialButtonComponent } from '../../../shared/components/fl-social-button/fl-social-button.component';

import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  eyeOffOutline,
  eyeOutline,
  lockClosedOutline,
  logoGoogle,
  mailOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonSpinner,
    FlLogoComponent,
    FlButtonComponent,
    FlInputComponent,
    FlSocialButtonComponent,
  ],
})
export class LoginPage {
  passwordVisible = false;
  isSubmitting = false;
  submitted = false;

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
  ) {
    addIcons({
      eyeOffOutline,
      eyeOutline,
      lockClosedOutline,
      logoGoogle,
      mailOutline,
    });
  }

  get emailInvalid(): boolean {
    const control = this.loginForm.controls.email;

    return control.invalid && (control.touched || this.submitted);
  }

  get passwordInvalid(): boolean {
    const control = this.loginForm.controls.password;

    return control.invalid && (control.touched || this.submitted);
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  async submitLogin(): Promise<void> {
    this.submitted = true;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      /*
       * Das Spring-Boot-Backend wird später hier aufgerufen.
       * Bis dahin simulieren wir einen erfolgreichen Login.
       */
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 600);
      });

      await this.router.navigateByUrl('/home', {
        replaceUrl: true,
      });
    } finally {
      this.isSubmitting = false;
    }
  }

  signInWithGoogle(): void {
    console.log('Google-Anmeldung wird später implementiert.');
  }
}
