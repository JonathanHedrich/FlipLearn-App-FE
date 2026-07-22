import { Component, OnInit, signal } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { GoogleAuthService } from './core/services/google-auth.service';
import { LanguageService } from './core/services/language.service';
import { StreakAlertService } from './core/services/streak-alert.service';
import { ThemeService } from './core/services/theme.service';

import { AnimatedSplashComponent } from './shared/components/animated-splash/animated-splash.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, AnimatedSplashComponent],
  templateUrl: 'app.component.html',
})
export class AppComponent implements OnInit {
  readonly showAnimatedSplash = signal(true);

  constructor(
    private readonly themeService: ThemeService,
    private readonly streakAlertService: StreakAlertService,
    private readonly languageService: LanguageService,
    private readonly googleAuthService: GoogleAuthService,
  ) {
    void this.themeService;
    void this.streakAlertService.checkAndNotify();
    void this.languageService.initialize();
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.googleAuthService.initialize();
    } catch (error: unknown) {
      console.error(
        'Google-Anmeldung konnte nicht initialisiert werden.',
        error,
      );
    }

    try {
      await SplashScreen.hide();
    } catch {
      // Der native SplashScreen ist im Browser möglicherweise nicht verfügbar.
    }
  }

  finishSplashAnimation(): void {
    this.showAnimatedSplash.set(false);
  }
}
