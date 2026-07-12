import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, mailOutline, personOutline } from 'ionicons/icons';

import { FlButtonComponent } from '../../../shared/components/fl-button/fl-button.component';
import { FlInputComponent } from '../../../shared/components/fl-input/fl-input.component';
import { FlLogoComponent } from '../../../shared/components/fl-logo/fl-logo.component';
import { FlSocialButtonComponent } from '../../../shared/components/fl-social-button/fl-social-button.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
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

  readonly registerForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
  ) {
    addIcons({
      lockClosedOutline,
      mailOutline,
      personOutline,
    });
  }

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

  get confirmPasswordInvalid(): boolean {
    const control = this.registerForm.controls.confirmPassword;

    return (
      (control.invalid || this.passwordsDoNotMatch) &&
      (control.touched || this.submitted)
    );
  }

  get passwordsDoNotMatch(): boolean {
    const password = this.registerForm.controls.password.value;
    const confirmation = this.registerForm.controls.confirmPassword.value;

    return confirmation.length > 0 && password !== confirmation;
  }

  async submitRegistration(): Promise<void> {
    this.submitted = true;
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid || this.passwordsDoNotMatch) {
      return;
    }

    this.isSubmitting = true;

    try {
      // Später kommt hier der Aufruf unseres Spring-Boot-Backends hin.
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 700);
      });

      await this.router.navigateByUrl('/home', {
        replaceUrl: true,
      });
    } finally {
      this.isSubmitting = false;
    }
  }

  registerWithGoogle(): void {
    console.log('Google-Registrierung wird später implementiert.');
  }
}
