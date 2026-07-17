import { DOCUMENT } from '@angular/common';
import { effect, Inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

export type AppLanguage = 'de' | 'en';

const LANGUAGE_STORAGE_KEY = 'fliplearn.language';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  readonly currentLanguage = this.translate.currentLang;

  constructor(
    private readonly translate: TranslateService,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {
    effect(() => {
      const language = this.translate.currentLang();

      if (language === 'de' || language === 'en') {
        this.document.documentElement.lang = language;
      }
    });
  }

  async initialize(): Promise<void> {
    const language = this.loadStoredLanguage();

    await this.setLanguage(language);
  }

  async setLanguage(language: AppLanguage): Promise<void> {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);

    await firstValueFrom(this.translate.use(language));
  }

  isSupportedLanguage(value: unknown): value is AppLanguage {
    return value === 'de' || value === 'en';
  }

  private loadStoredLanguage(): AppLanguage {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (this.isSupportedLanguage(storedLanguage)) {
      return storedLanguage;
    }

    const browserLanguage = navigator.language.toLowerCase();

    if (browserLanguage.startsWith('en')) {
      return 'en';
    }

    return 'de';
  }
}
