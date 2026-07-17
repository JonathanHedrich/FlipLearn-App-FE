import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
  saveOutline,
} from 'ionicons/icons';

import { AuthApi } from '../../../core/services/auth-api';
import { AuthStore } from '../../../core/stores/auth.store';
import { FlashcardStore } from '../../../core/stores/flashcard.store';
import { StatisticsStore } from '../../../core/stores/statistics.store';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [ReactiveFormsModule, IonContent, IonIcon, TranslatePipe],
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss'],
})
export class EditProfilePage {
  isSubmitting = false;
  submitted = false;

  saveError = '';
  saveSuccess = '';

  emailSubmitted = false;
  isChangingEmail = false;
  emailError = '';

  passwordSubmitted = false;
  isChangingPassword = false;
  passwordError = '';
  passwordSuccess = '';

  readonly profileForm = this.formBuilder.nonNullable.group({
    displayName: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(150)],
    ],
    username: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
  });

  readonly emailForm = this.formBuilder.nonNullable.group({
    currentEmail: [
      {
        value: '',
        disabled: true,
      },
    ],
    newEmail: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(255)],
    ],
    currentPassword: ['', [Validators.required]],
  });

  readonly passwordForm = this.formBuilder.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
    ],
    confirmPassword: ['', [Validators.required]],
  });

  constructor(
    private readonly location: Location,
    private readonly formBuilder: FormBuilder,
    private readonly authApi: AuthApi,
    private readonly authStore: AuthStore,
    private readonly router: Router,
    private readonly flashcardStore: FlashcardStore,
    private readonly statisticsStore: StatisticsStore,
    private readonly translate: TranslateService,
  ) {
    addIcons({
      arrowBackOutline,
      personOutline,
      saveOutline,
      mailOutline,
      lockClosedOutline,
    });
  }

  ionViewWillEnter(): void {
    void this.loadProfile();
  }

  get displayNameInvalid(): boolean {
    const control = this.profileForm.controls.displayName;

    return control.invalid && (control.touched || this.submitted);
  }

  get usernameInvalid(): boolean {
    const control = this.profileForm.controls.username;

    return control.invalid && (control.touched || this.submitted);
  }

  get newEmailInvalid(): boolean {
    const control = this.emailForm.controls.newEmail;

    return control.invalid && (control.touched || this.emailSubmitted);
  }

  get passwordsDoNotMatch(): boolean {
    return (
      this.passwordForm.controls.newPassword.value !==
      this.passwordForm.controls.confirmPassword.value
    );
  }

  goBack(): void {
    this.location.back();
  }

  async saveProfile(): Promise<void> {
    if (this.isSubmitting) {
      return;
    }

    this.submitted = true;
    this.saveError = '';
    this.saveSuccess = '';

    this.profileForm.markAllAsTouched();

    if (this.profileForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      const value = this.profileForm.getRawValue();

      const updatedUser = await firstValueFrom(
        this.authApi.updateProfile({
          displayName: value.displayName.trim(),
          username: value.username.trim(),
        }),
      );

      this.authApi.setCurrentUser(updatedUser);
      this.authStore.updateProfileData(updatedUser);

      this.saveSuccess = this.translate.instant(
        'editProfile.messages.profileSaved',
      );
    } catch (error: unknown) {
      this.saveError = this.resolveRequestError(
        error,
        'editProfile.errors.profileSaveFailed',
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  async changeEmail(): Promise<void> {
    if (this.isChangingEmail) {
      return;
    }

    this.emailSubmitted = true;
    this.emailError = '';

    this.emailForm.markAllAsTouched();

    if (this.emailForm.invalid) {
      return;
    }

    this.isChangingEmail = true;

    try {
      const value = this.emailForm.getRawValue();

      await firstValueFrom(
        this.authApi.changeEmail({
          newEmail: value.newEmail.trim(),
          currentPassword: value.currentPassword,
        }),
      );

      /*
       * Das bestehende JWT enthält weiterhin die alte
       * E-Mail-Adresse. Deshalb ist eine neue Anmeldung nötig.
       */
      this.authApi.logout();
      this.authStore.clear();
      this.flashcardStore.clear();
      this.statisticsStore.clear();

      window.alert(this.translate.instant('editProfile.messages.emailChanged'));

      await this.router.navigateByUrl('/login', {
        replaceUrl: true,
      });
    } catch (error: unknown) {
      this.emailError = this.resolveRequestError(
        error,
        'editProfile.errors.emailChangeFailed',
      );
    } finally {
      this.isChangingEmail = false;
    }
  }

  async changePassword(): Promise<void> {
    if (this.isChangingPassword) {
      return;
    }

    this.passwordSubmitted = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    this.passwordForm.markAllAsTouched();

    if (this.passwordForm.invalid || this.passwordsDoNotMatch) {
      return;
    }

    this.isChangingPassword = true;

    try {
      const value = this.passwordForm.getRawValue();

      await firstValueFrom(
        this.authApi.changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        }),
      );

      this.passwordSuccess = this.translate.instant(
        'editProfile.messages.passwordChanged',
      );

      this.passwordForm.reset();
      this.passwordSubmitted = false;
    } catch (error: unknown) {
      this.passwordError = this.resolveRequestError(
        error,
        'editProfile.errors.passwordChangeFailed',
      );
    } finally {
      this.isChangingPassword = false;
    }
  }

  async loadProfile(): Promise<void> {
    try {
      const user = await firstValueFrom(this.authApi.loadCurrentUser());

      this.authStore.updateProfileData(user);

      this.profileForm.patchValue({
        displayName: user.displayName,
        username: user.username,
      });

      this.emailForm.patchValue({
        currentEmail: user.email,
        newEmail: '',
        currentPassword: '',
      });
    } catch {
      this.loadCurrentValues();
    }
  }

  private loadCurrentValues(): void {
    const user = this.authStore.currentUser();
    const profile = this.authStore.profile();

    this.profileForm.patchValue({
      displayName: user?.displayName ?? profile?.displayName ?? '',
      username: user?.username ?? '',
    });

    this.emailForm.patchValue({
      currentEmail: user?.email ?? profile?.email ?? '',
      newEmail: '',
      currentPassword: '',
    });
  }

  private resolveRequestError(error: unknown, fallbackKey: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return this.translate.instant(fallbackKey);
    }

    if (error.status === 0) {
      return this.translate.instant('editProfile.errors.backendUnavailable');
    }

    if (error.status === 401) {
      return this.translate.instant('editProfile.errors.sessionExpired');
    }

    if (error.status === 403) {
      return this.translate.instant('editProfile.errors.invalidPassword');
    }

    if (error.status === 409) {
      return this.translate.instant('editProfile.errors.alreadyInUse');
    }

    if (
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return this.translate.instant(fallbackKey);
  }
}
