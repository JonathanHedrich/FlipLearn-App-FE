import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';

import {
  ApiErrorResponse,
  LoginRequest,
} from '../../../core/models/auth.model';
import { AuthApi } from '../../../core/services/auth-api';
import { FlButtonComponent } from '../../../shared/components/fl-button/fl-button.component';
import { FlInputComponent } from '../../../shared/components/fl-input/fl-input.component';
import { FlLogoComponent } from '../../../shared/components/fl-logo/fl-logo.component';
import { FlSocialButtonComponent } from '../../../shared/components/fl-social-button/fl-social-button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IonContent,
    FlLogoComponent,
    FlButtonComponent,
    FlInputComponent,
    FlSocialButtonComponent,
  ],
})
export class LoginPage {
  isSubmitting = false;
  submitted = false;
  loginError = '';

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly authApi: AuthApi,
  ) {}

  get emailInvalid(): boolean {
    const control = this.loginForm.controls.email;

    return control.invalid && (control.touched || this.submitted);
  }

  get passwordInvalid(): boolean {
    const control = this.loginForm.controls.password;

    return control.invalid && (control.touched || this.submitted);
  }

  async submitLogin(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.submitted = true;
    this.loginError = '';
    this.loginForm.markAllAsTouched();

    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.loginForm.getRawValue();

      const request: LoginRequest = {
        email: formValue.email.trim().toLowerCase(),
        password: formValue.password,
      };

      await firstValueFrom(this.authApi.login(request));

      await firstValueFrom(this.authApi.loadCurrentUser());

      await this.router.navigateByUrl('/home', {
        replaceUrl: true,
      });
    } catch (error: unknown) {
      this.loginError = this.resolveLoginError(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  signInWithGoogle(): void {
    console.log('Google-Anmeldung wird später implementiert.');
  }

  private resolveLoginError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Beim Anmelden ist ein unbekannter Fehler aufgetreten.';
    }

    if (error.status === 0) {
      return 'Das Backend ist nicht erreichbar. Prüfe, ob Spring Boot auf Port 8080 läuft.';
    }

    if (error.status === 401) {
      return 'E-Mail-Adresse oder Passwort ist falsch.';
    }

    const apiError = error.error as Partial<ApiErrorResponse> | null;

    return (
      apiError?.message ??
      'Die Anmeldung ist fehlgeschlagen. Bitte versuche es erneut.'
    );
  }
}
