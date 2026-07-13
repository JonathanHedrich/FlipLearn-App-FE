import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    loadComponent: () =>
      import('./features/auth/splash/splash.page').then(
        (page) => page.SplashPage,
      ),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.page').then((page) => page.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.page').then(
        (page) => page.RegisterPage,
      ),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.page').then(
        (page) => page.ForgotPasswordPage,
      ),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/home/home.page').then(
        (page) => page.HomePage,
      ),
  },
  {
    path: 'sets',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/flashcards/flashcard-list/flashcard-list.page').then(
        (page) => page.FlashcardListPage,
      ),
  },
  {
    path: 'sets/create',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/flashcards/create-set/create-set.page').then(
        (page) => page.CreateSetPage,
      ),
  },
  {
    path: 'sets/:setId/edit',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/flashcards/editor/editor.page').then(
        (page) => page.EditorPage,
      ),
  },
  {
    path: 'study/:setId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/study/study-session/study-session.page').then(
        (page) => page.StudySessionPage,
      ),
  },
  {
    path: 'statistics',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/statistics/statistics/statistics.page').then(
        (page) => page.StatisticsPage,
      ),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile/profile.page').then(
        (page) => page.ProfilePage,
      ),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings/settings.page').then(
        (page) => page.SettingsPage,
      ),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notifications/notifications.page').then(
        (page) => page.NotificationsPage,
      ),
  },
  {
    path: '**',
    redirectTo: 'splash',
  },
];
