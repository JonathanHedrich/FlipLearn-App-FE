import { Routes } from '@angular/router';

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
    loadComponent: () =>
      import('./features/auth/login/login.page').then((page) => page.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.page').then(
        (page) => page.RegisterPage,
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.page').then(
        (page) => page.ForgotPasswordPage,
      ),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/dashboard/home/home.page').then(
        (page) => page.HomePage,
      ),
  },
  {
    path: 'sets',
    loadComponent: () =>
      import('./features/flashcards/flashcard-list/flashcard-list.page').then(
        (page) => page.FlashcardListPage,
      ),
  },
  {
    path: 'sets/create',
    loadComponent: () =>
      import('./features/flashcards/create-set/create-set.page').then(
        (page) => page.CreateSetPage,
      ),
  },
  {
    path: 'sets/:setId/edit',
    loadComponent: () =>
      import('./features/flashcards/editor/editor.page').then(
        (page) => page.EditorPage,
      ),
  },
  {
    path: 'study/:setId',
    loadComponent: () =>
      import('./features/study/study-session/study-session.page').then(
        (page) => page.StudySessionPage,
      ),
  },
  {
    path: 'statistics',
    loadComponent: () =>
      import('./features/statistics/statistics/statistics.page').then(
        (page) => page.StatisticsPage,
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile/profile.page').then(
        (page) => page.ProfilePage,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/settings/settings.page').then(
        (page) => page.SettingsPage,
      ),
  },
  {
    path: 'notifications',
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
