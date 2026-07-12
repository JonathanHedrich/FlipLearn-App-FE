import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  flameOutline,
  timeOutline,
  trophyOutline,
} from 'ionicons/icons';

import { FlBottomNavComponent } from '../../../shared/components/fl-bottom-nav/fl-bottom-nav.component';

interface SetAccuracy {
  id: number;
  title: string;
  accuracy: number;
  theme: 'blue' | 'purple' | 'green' | 'orange';
}

interface ChartPoint {
  day: string;
  value: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [IonContent, IonIcon, FlBottomNavComponent],
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
})
export class StatisticsPage {
  readonly weeklyCards = 271;
  readonly weeklyStudyTime = '3h 8m';
  readonly weeklyAccuracy = 82;
  readonly streakDays = 14;

  readonly chartPoints: ChartPoint[] = [
    { day: 'Mon', value: 25, x: 0, y: 70 },
    { day: 'Tue', value: 39, x: 46, y: 54 },
    { day: 'Wed', value: 17, x: 92, y: 78 },
    { day: 'Thu', value: 52, x: 138, y: 38 },
    { day: 'Fri', value: 31, x: 184, y: 61 },
    { day: 'Sat', value: 74, x: 230, y: 16 },
    { day: 'Sun', value: 47, x: 276, y: 45 },
  ];

  readonly setAccuracies: SetAccuracy[] = [
    {
      id: 1,
      title: 'Spanish Vocabulary',
      accuracy: 85,
      theme: 'blue',
    },
    {
      id: 2,
      title: 'Chemistry Basics',
      accuracy: 68,
      theme: 'purple',
    },
    {
      id: 3,
      title: 'World Capitals',
      accuracy: 92,
      theme: 'green',
    },
    {
      id: 4,
      title: 'JavaScript Concepts',
      accuracy: 55,
      theme: 'orange',
    },
  ];

  constructor() {
    addIcons({
      bookOutline,
      flameOutline,
      timeOutline,
      trophyOutline,
    });
  }

  get chartPolylinePoints(): string {
    return this.chartPoints.map((point) => `${point.x},${point.y}`).join(' ');
  }

  get chartAreaPoints(): string {
    return `0,96 ${this.chartPolylinePoints} 276,96`;
  }
}
