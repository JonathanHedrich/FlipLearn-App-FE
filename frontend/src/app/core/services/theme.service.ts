import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'fliplearn.theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly themeState = signal<AppTheme>('system');

  readonly theme = this.themeState.asReadonly();

  constructor(
    @Inject(DOCUMENT)
    private readonly document: Document,

    @Inject(PLATFORM_ID)
    private readonly platformId: object,
  ) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const storedTheme = localStorage.getItem(
      THEME_STORAGE_KEY,
    ) as AppTheme | null;

    this.setTheme(storedTheme ?? 'system', false);
  }

  setTheme(theme: AppTheme, persist = true): void {
    this.themeState.set(theme);

    if (persist && isPlatformBrowser(this.platformId)) {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    this.applyTheme(theme);
  }

  private applyTheme(theme: AppTheme): void {
    const body = this.document.body;

    body.classList.remove('theme-light', 'theme-dark', 'theme-system');

    body.classList.add(`theme-${theme}`);

    if (theme === 'system') {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;

      body.classList.toggle('dark', prefersDark);

      return;
    }

    body.classList.toggle('dark', theme === 'dark');
  }
}
