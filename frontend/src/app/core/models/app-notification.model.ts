export type AppNotificationType = 'goal' | 'streak' | 'achievement' | 'warning';

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  icon: string;
  createdAt: Date;
  read: boolean;
  route?: string;
}
