import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import {
  ApiErrorResponse,
  LoginRequest,
} from '../../../core/models/auth.model';
import { AuthApi } from '../../../core/services/auth-api';
import {
  GoogleAuthService,
  GoogleIdTokenMissingError,
  GoogleLoginCancelledError,
} from '../../../core/services/google-auth.service';
import { AuthStore } from '../../../core/stores/auth.store';

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
    TranslatePipe,
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
    private readonly route: ActivatedRoute,
    private readonly authStore: AuthStore,
    private readonly googleAuthService: GoogleAuthService,
    private readonly translate: TranslateService,
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

      const response = await firstValueFrom(this.authApi.login(request));

      this.authStore.setCurrentUser(response);

      const currentUser = await firstValueFrom(this.authApi.loadCurrentUser());

      this.authStore.setCurrentUser(currentUser);

      await this.navigateAfterLogin();
    } catch (error: unknown) {
      this.loginError = this.resolveLoginError(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  async signInWithGoogle(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.loginError = '';
    this.isSubmitting = true;

    try {
      await this.googleAuthService.login();
      await this.navigateAfterLogin();
    } catch (error: unknown) {
      this.loginError = this.resolveGoogleLoginError(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private async navigateAfterLogin(): Promise<void> {
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') ?? '/home';

    await this.router.navigateByUrl(returnUrl, {
      replaceUrl: true,
    });
  }

  private resolveGoogleLoginError(error: unknown): string {
    if (error instanceof GoogleLoginCancelledError) {
      return '';
    }

    if (error instanceof GoogleIdTokenMissingError) {
      return this.translate.instant('login.errors.googleTokenMissing');
    }

    return this.resolveLoginError(error);
  }

  private resolveLoginError(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return this.translate.instant('login.errors.unknown');
    }

    if (error.status === 0) {
      return this.translate.instant('login.errors.backendUnavailable');
    }

    if (error.status === 401) {
      return this.translate.instant('login.errors.invalidCredentials');
    }

    const apiError = error.error as Partial<ApiErrorResponse> | null;

    return (
      apiError?.message ?? this.translate.instant('login.errors.loginFailed')
    );
  }
}
