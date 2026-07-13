import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  lockClosedOutline,
  mailOutline,
  personOutline,
  saveOutline,
} from 'ionicons/icons';
import { Router } from '@angular/router';

import { FlashcardStore } from '../../../core/stores/flashcard.store';
import { StatisticsStore } from '../../../core/stores/statistics.store';

import { AuthApi } from '../../../core/services/auth-api';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [ReactiveFormsModule, IonContent, IonIcon],
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

      this.saveSuccess = 'Dein Profil wurde gespeichert.';
    } catch (error: unknown) {
      this.saveError = this.resolveRequestError(
        error,
        'Das Profil konnte nicht gespeichert werden.',
      );
    } finally {
      this.isSubmitting = false;
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

  get newEmailInvalid(): boolean {
    const control = this.emailForm.controls.newEmail;

    return control.invalid && (control.touched || this.emailSubmitted);
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
       * Das bisherige JWT enthält noch die alte
       * E-Mail-Adresse. Deshalb ist nach der
       * Änderung eine neue Anmeldung erforderlich.
       */
      this.authApi.logout();
      this.authStore.clear();
      this.flashcardStore.clear();
      this.statisticsStore.clear();

      window.alert(
        'Deine E-Mail-Adresse wurde geändert. Bitte melde dich mit der neuen Adresse erneut an.',
      );

      await this.router.navigateByUrl('/login', {
        replaceUrl: true,
      });
    } catch (error: unknown) {
      this.emailError = this.resolveRequestError(
        error,
        'Die E-Mail-Adresse konnte nicht geändert werden.',
      );
    } finally {
      this.isChangingEmail = false;
    }
  }

  private resolveRequestError(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    if (error.status === 0) {
      return 'Das Backend ist nicht erreichbar.';
    }

    if (
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    return fallback;
  }

  get passwordsDoNotMatch(): boolean {
    return (
      this.passwordForm.controls.newPassword.value !==
      this.passwordForm.controls.confirmPassword.value
    );
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

      this.passwordSuccess = 'Dein Passwort wurde erfolgreich geändert.';

      this.passwordForm.reset();
      this.passwordSubmitted = false;
    } catch (error: unknown) {
      this.passwordError = this.resolveRequestError(
        error,
        'Das Passwort konnte nicht geändert werden.',
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
}
