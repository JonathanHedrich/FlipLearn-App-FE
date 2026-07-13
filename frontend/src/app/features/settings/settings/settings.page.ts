import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonToggle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { FormsModule } from '@angular/forms';
import { AuthApi } from '../../../core/services/auth-api';
import {
  arrowBackOutline,
  chevronForwardOutline,
  layersOutline,
  lockClosedOutline,
  logOutOutline,
  personOutline,
  radioButtonOnOutline,
} from 'ionicons/icons';

interface SettingsRow {
  label: string;
  value?: string;
  icon: string;
  action: 'goal' | 'order' | 'password';
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [IonContent, IonIcon, IonToggle, FormsModule],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  studyRemindersEnabled = true;
  streakAlertsEnabled = true;

  readonly user = {
    initials: 'AJ',
    name: 'Alex Johnson',
    email: 'alex@example.com',
  };

  readonly studyPreferences: SettingsRow[] = [
    {
      label: 'Daily Study Goal',
      value: '30 cards',
      icon: 'radio-button-on-outline',
      action: 'goal',
    },
    {
      label: 'Card Order',
      value: 'Random',
      icon: 'layers-outline',
      action: 'order',
    },
  ];

  readonly accountRows: SettingsRow[] = [
    {
      label: 'Change Password',
      icon: 'lock-closed-outline',
      action: 'password',
    },
  ];

  constructor(
    private readonly location: Location,
    private readonly router: Router,
    private readonly authApi: AuthApi,
  ) {
    addIcons({
      arrowBackOutline,
      chevronForwardOutline,
      layersOutline,
      lockClosedOutline,
      logOutOutline,
      personOutline,
      radioButtonOnOutline,
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/profile');
  }

  editProfile(): void {
    console.log('Profil bearbeiten wird später ergänzt.');
  }

  openSetting(action: SettingsRow['action']): void {
    console.log('Einstellung öffnen:', action);
  }

  logout(): void {
    const confirmed = window.confirm('Möchtest du dich wirklich abmelden?');

    if (!confirmed) {
      return;
    }

    this.authApi.logout();

    void this.router.navigateByUrl('/login', {
      replaceUrl: true,
    });
  }
}
