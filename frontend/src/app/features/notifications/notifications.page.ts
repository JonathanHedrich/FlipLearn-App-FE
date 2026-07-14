import { CommonModule, Location } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  checkmarkCircleOutline,
  flameOutline,
  radioButtonOnOutline,
  trashOutline,
  trophyOutline,
} from 'ionicons/icons';

import { AppNotification } from '../../core/models/app-notification.model';
import { AppNotificationService } from '../../core/services/app-notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon],
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage {
  readonly notifications = this.notificationService.notifications;

  readonly unreadCount = this.notificationService.unreadCount;

  constructor(
    private readonly location: Location,
    private readonly router: Router,
    private readonly notificationService: AppNotificationService,
  ) {
    addIcons({
      alertCircleOutline,
      arrowBackOutline,
      checkmarkCircleOutline,
      flameOutline,
      radioButtonOnOutline,
      trashOutline,
      trophyOutline,
    });
  }

  ionViewWillEnter(): void {
    this.notificationService.rebuildNotifications();
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/home');
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  openNotification(notification: AppNotification): void {
    this.notificationService.markAsRead(notification.id);

    if (!notification.route) {
      return;
    }

    void this.router.navigateByUrl(notification.route);
  }

  getTimeLabel(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  deleteNotification(notification: AppNotification, event: Event): void {
    event.stopPropagation();

    this.notificationService.removeNotification(notification.id);
  }

  deleteAllNotifications(): void {
    const confirmed = window.confirm(
      'Möchtest du alle Benachrichtigungen löschen?',
    );

    if (!confirmed) {
      return;
    }

    this.notificationService.removeAllNotifications();
  }
}
