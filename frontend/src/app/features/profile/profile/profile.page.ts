import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  chevronForwardOutline,
  notificationsOutline,
  settingsOutline,
  starOutline,
} from 'ionicons/icons';

import { FlBottomNavComponent } from '../../../shared/components/fl-bottom-nav/fl-bottom-nav.component';

type ProfileSetTheme = 'blue' | 'purple' | 'green' | 'orange';

interface ProfileSet {
  id: number;
  title: string;
  cards: number;
  progress: number;
  theme: ProfileSetTheme;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonContent, IonIcon, FlBottomNavComponent],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage {
  readonly user = {
    initials: 'AJ',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    memberSince: 'Jan 2024',
  };

  readonly stats = {
    sets: 4,
    cards: 16,
    streak: 14,
    accuracy: 87,
  };

  readonly sets: ProfileSet[] = [
    {
      id: 1,
      title: 'Spanish Vocabulary',
      cards: 5,
      progress: 72,
      theme: 'blue',
    },
    {
      id: 2,
      title: 'Chemistry Basics',
      cards: 4,
      progress: 45,
      theme: 'purple',
    },
    {
      id: 3,
      title: 'World Capitals',
      cards: 4,
      progress: 90,
      theme: 'green',
    },
    {
      id: 4,
      title: 'JavaScript Concepts',
      cards: 3,
      progress: 30,
      theme: 'orange',
    },
  ];

  constructor(private readonly router: Router) {
    addIcons({
      bookOutline,
      chevronForwardOutline,
      notificationsOutline,
      settingsOutline,
      starOutline,
    });
  }

  openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  openSettings(): void {
    void this.router.navigateByUrl('/settings');
  }

  openSet(setId: number): void {
    void this.router.navigate(['/sets', setId, 'edit']);
  }
}
