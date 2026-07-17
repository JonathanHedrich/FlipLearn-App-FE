import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-flashcard-detail',
  templateUrl: './flashcard-detail.page.html',
  styleUrls: ['./flashcard-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    TranslatePipe,
  ],
})
export class FlashcardDetailPage implements OnInit {
  constructor() {}

  ngOnInit() {}
}
