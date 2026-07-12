import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  flameOutline,
  flashOutline,
  starOutline,
  trophyOutline,
  checkmarkDoneOutline,
} from 'ionicons/icons';

type NotificationType = 'streak' | 'achievement' | 'goal' | 'new' | 'reminder';

interface NotificationItem {
  id: number;

  type: NotificationType;

  title: string;

  message: string;

  time: string;

  unread: boolean;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [IonContent, IonIcon],
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage {
  notifications: NotificationItem[] = [
    {
      id: 1,
      type: 'streak',
      title: 'Streak Alert!',
      message: 'Study today to keep your 14-day streak alive!',
      time: '2m ago',
      unread: true,
    },

    {
      id: 2,
      type: 'achievement',
      title: 'Achievement unlocked',
      message: 'You mastered 100 cards in Spanish.',
      time: '1h ago',
      unread: true,
    },

    {
      id: 3,
      type: 'goal',
      title: 'Daily Goal Complete',
      message: 'Amazing! You completed today´s goal.',
      time: '3h ago',
      unread: false,
    },

    {
      id: 4,
      type: 'new',
      title: 'New Set Available',
      message: 'Advanced Grammar is now available.',
      time: '1d ago',
      unread: false,
    },

    {
      id: 5,
      type: 'reminder',
      title: 'Quick Reminder',
      message: '5 minute Chemistry session ready.',
      time: '2d ago',
      unread: false,
    },
  ];

  constructor(
    private location: Location,
    private router: Router,
  ) {
    addIcons({
      arrowBackOutline,
      flameOutline,
      flashOutline,
      trophyOutline,
      starOutline,
      checkmarkDoneOutline,
    });
  }

  get unreadCount(): number {
    return this.notifications.filter((notification) => notification.unread)
      .length;
  }

  back(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/home');
  }

  markAllRead(): void {
    this.notifications = this.notifications.map((notification) => ({
      ...notification,
      unread: false,
    }));
  }
}
