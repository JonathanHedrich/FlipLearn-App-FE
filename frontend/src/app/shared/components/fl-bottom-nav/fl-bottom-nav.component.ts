import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  homeOutline,
  layersOutline,
  personOutline,
} from 'ionicons/icons';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'fl-bottom-nav',
  standalone: true,
  imports: [RouterLink, IonIcon, TranslatePipe],
  templateUrl: './fl-bottom-nav.component.html',
  styleUrls: ['./fl-bottom-nav.component.scss'],
})
export class FlBottomNavComponent {
  @Input() activePage: 'home' | 'sets' | 'statistics' | 'profile' = 'home';

  constructor() {
    addIcons({
      barChartOutline,
      homeOutline,
      layersOutline,
      personOutline,
    });
  }
}
