import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';

import {
  ApiErrorResponse,
  RegisterRequest,
} from '../../../core/models/auth.model';
import { AuthApi } from '../../../core/services/auth-api';
import { FlButtonComponent } from '../../../shared/components/fl-button/fl-button.component';
import { FlInputComponent } from '../../../shared/components/fl-input/fl-input.component';
import { FlLogoComponent } from '../../../shared/components/fl-logo/fl-logo.component';
import { FlSocialButtonComponent } from '../../../shared/components/fl-social-button/fl-social-button.component';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    FlButtonComponent,
    FlInputComponent,
    FlLogoComponent,
    FlSocialButtonComponent,
  ],
})
export class RegisterPage {
  submitted = false;
  isSubmitting = false;
  registerError = '';

  readonly registerForm = this.formBuilder.nonNullable.group({
    name: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(150)],
    ],
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(255)],
    ],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
    ],
    confirmPassword: ['', [Validators.required]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly authApi: AuthApi,
  ) {}

  get nameInvalid(): boolean {
    const control = this.registerForm.controls.name;

    return control.invalid && (control.touched || this.submitted);
  }

  get emailInvalid(): boolean {
    const control = this.registerForm.controls.email;

    return control.invalid && (control.touched || this.submitted);
  }

  get passwordInvalid(): boolean {
    const control = this.registerForm.controls.password;

    return control.invalid && (control.touched || this.submitted);
  }

  get passwordsDoNotMatch(): boolean {
    const password = this.registerForm.controls.password.value;

    const confirmation = this.registerForm.controls.confirmPassword.value;

    return confirmation.length > 0 && password !== confirmation;
  }

  get confirmPasswordInvalid(): boolean {
    const control = this.registerForm.controls.confirmPassword;

    return (
      (control.invalid || this.passwordsDoNotMatch) &&
      (control.touched || this.submitted)
    );
  }

  async submitRegistration(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.submitted = true;
    this.registerError = '';
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid || this.passwordsDoNotMatch) {
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.registerForm.getRawValue();

      const request: RegisterRequest = {
        displayName: formValue.name.trim(),
        email: formValue.email.trim().toLowerCase(),
        password: formValue.password,
      };

      await firstValueFrom(this.authApi.register(request));

      await firstValueFrom(
        this.authApi.login({
          email: request.email,
          password: request.password,
        }),
      );

      await firstValueFrom(this.authApi.loadCurrentUser());

      await this.router.navigateByUrl('/home', {
        replaceUrl: true,
      });
    } catch (error: unknown) {
      this.registerError = this.resolveRegistrationError(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  registerWithGoogle(): void {
    console.log('Google-Registrierung wird später implementiert.');
  }

  private resolveRegistrationError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Bei der Registrierung ist ein unbekannter Fehler aufgetreten.';
    }

    if (error.status === 0) {
      return 'Das Backend ist nicht erreichbar. Prüfe, ob Spring Boot läuft.';
    }

    const apiError = error.error as Partial<ApiErrorResponse> | null;

    if (error.status === 409) {
      return (
        apiError?.message ??
        'Für diese E-Mail-Adresse existiert bereits ein Konto.'
      );
    }

    if (error.status === 400) {
      const validationErrors = apiError?.validationErrors;

      if (validationErrors) {
        return (
          Object.values(validationErrors)[0] ??
          'Die eingegebenen Daten sind ungültig.'
        );
      }
    }

    return apiError?.message ?? 'Die Registrierung ist fehlgeschlagen.';
  }
}
