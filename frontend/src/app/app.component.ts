import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { ThemeService } from './core/services/theme.service';
import { StreakAlertService } from './core/services/streak-alert.service';

import { LanguageService } from './core/services/language.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, TranslatePipe],
  templateUrl: 'app.component.html',
})
export class AppComponent {
  constructor(
    private readonly themeService: ThemeService,
    private readonly streakAlertService: StreakAlertService,
    private readonly languageService: LanguageService,
  ) {
    void this.themeService;
    void this.streakAlertService.checkAndNotify();
    void this.languageService.initialize();
  }
}
