import { Component, OnInit, signal } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SplashScreen } from '@capacitor/splash-screen';

import { ThemeService } from './core/services/theme.service';
import { StreakAlertService } from './core/services/streak-alert.service';
import { LanguageService } from './core/services/language.service';

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
  ) {
    void this.themeService;
    void this.streakAlertService.checkAndNotify();
    void this.languageService.initialize();
  }

  async ngOnInit(): Promise<void> {
    try {
      await SplashScreen.hide();
    } catch {
      // Browser
    }
  }

  finishSplashAnimation(): void {
    this.showAnimatedSplash.set(false);
  }
}
