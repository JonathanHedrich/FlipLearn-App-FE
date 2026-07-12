import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  bookOutline,
  flameOutline,
  layersOutline,
  notificationsOutline,
  settingsOutline,
  timeOutline,
  trophyOutline,
} from 'ionicons/icons';

import { FlBottomNavComponent } from '../../../shared/components/fl-bottom-nav/fl-bottom-nav.component';

interface StudySet {
  id: number;
  title: string;
  subtitle: string;
  cards: number;
  progress: number;
  theme: 'blue' | 'purple' | 'green';
}

interface Activity {
  id: number;
  title: string;
  description: string;
  result: string;
  theme: 'blue' | 'purple' | 'green';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, IonContent, IonIcon, FlBottomNavComponent],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  readonly userName = 'Alex Johnson';

  readonly studySets: StudySet[] = [
    {
      id: 1,
      title: 'Spanish Vocabulary',
      subtitle: '2h ago',
      cards: 5,
      progress: 72,
      theme: 'blue',
    },
    {
      id: 2,
      title: 'Chemistry Basics',
      subtitle: '1d ago',
      cards: 4,
      progress: 45,
      theme: 'purple',
    },
    {
      id: 3,
      title: 'World Capitals',
      subtitle: '3h ago',
      cards: 15,
      progress: 93,
      theme: 'green',
    },
  ];

  readonly activities: Activity[] = [
    {
      id: 1,
      title: 'World Capitals',
      description: 'Studied 15 cards · 3h ago',
      result: '93%',
      theme: 'green',
    },
    {
      id: 2,
      title: 'Spanish Vocabulary',
      description: 'Studied 5 cards · 2h ago',
      result: '72%',
      theme: 'blue',
    },
  ];

  constructor(private readonly router: Router) {
    addIcons({
      barChartOutline,
      bookOutline,
      flameOutline,
      layersOutline,
      notificationsOutline,
      settingsOutline,
      timeOutline,
      trophyOutline,
    });
  }

  openNotifications(): void {
    void this.router.navigateByUrl('/notifications');
  }

  openSettings(): void {
    void this.router.navigateByUrl('/settings');
  }

  openSet(id: number): void {
    void this.router.navigate(['/study', id]);
  }
}
