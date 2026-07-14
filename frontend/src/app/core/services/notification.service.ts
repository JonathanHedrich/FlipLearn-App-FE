import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  isSupported(): boolean {
    return 'Notification' in window;
  }

  get permission(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }

    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }

    return Notification.requestPermission();
  }

  show(title: string, options?: NotificationOptions): void {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    new Notification(title, options);
  }
}
