import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';

import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'fl-button',
  standalone: true,
  imports: [IonSpinner, TranslatePipe],
  templateUrl: './fl-button.component.html',
  styleUrls: ['./fl-button.component.scss'],
})
export class FlButtonComponent {
  @Input() text = '';

  @Input() expand: 'block' | 'full' = 'block';

  @Input() color = 'primary';

  @Input() fill: 'solid' | 'outline' | 'clear' = 'solid';

  @Input() loading = false;

  @Input() disabled = false;

  @Output() clicked = new EventEmitter<void>();

  onClick() {
    if (!this.loading && !this.disabled) {
      this.clicked.emit();
    }
  }
}
