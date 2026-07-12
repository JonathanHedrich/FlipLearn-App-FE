import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  homeOutline,
  layersOutline,
  personOutline,
} from 'ionicons/icons';

@Component({
  selector: 'fl-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IonIcon],
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
