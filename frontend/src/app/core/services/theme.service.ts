import { Injectable, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'fliplearn.theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly themeState = signal<AppTheme>(this.loadStoredTheme());

  readonly theme = this.themeState.asReadonly();

  private readonly systemThemeQuery = window.matchMedia(
    '(prefers-color-scheme: dark)',
  );

  constructor() {
    this.applyTheme(this.themeState());

    this.systemThemeQuery.addEventListener(
      'change',
      this.handleSystemThemeChange,
    );
  }

  setTheme(theme: AppTheme): void {
    this.themeState.set(theme);

    localStorage.setItem(THEME_STORAGE_KEY, theme);

    this.applyTheme(theme);
  }

  private loadStoredTheme(): AppTheme {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (
      storedTheme === 'light' ||
      storedTheme === 'dark' ||
      storedTheme === 'system'
    ) {
      return storedTheme;
    }

    return 'system';
  }

  private applyTheme(theme: AppTheme): void {
    const useDarkTheme =
      theme === 'dark' || (theme === 'system' && this.systemThemeQuery.matches);

    document.body.classList.toggle('dark', useDarkTheme);

    document.documentElement.style.colorScheme = useDarkTheme
      ? 'dark'
      : 'light';
  }

  private readonly handleSystemThemeChange = (): void => {
    if (this.themeState() === 'system') {
      this.applyTheme('system');
    }
  };
}
