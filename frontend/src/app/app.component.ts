import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

import { ThemeService } from './core/services/theme.service';
import { StreakAlertService } from './core/services/streak-alert.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  templateUrl: 'app.component.html',
})
export class AppComponent {
  constructor(
    private readonly themeService: ThemeService,
    private readonly streakAlertService: StreakAlertService,
  ) {
    void this.themeService;
    void this.streakAlertService.checkAndNotify();
  }
}
