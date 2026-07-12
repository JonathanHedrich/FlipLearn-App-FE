import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoApple, logoGoogle, logoMicrosoft } from 'ionicons/icons';

type SocialProvider = 'google' | 'apple' | 'microsoft';

@Component({
  selector: 'fl-social-button',
  standalone: true,
  imports: [IonIcon, IonSpinner],
  templateUrl: './fl-social-button.component.html',
  styleUrls: ['./fl-social-button.component.scss'],
})
export class FlSocialButtonComponent {
  @Input() provider: SocialProvider = 'google';
  @Input() text = '';
  @Input() loading = false;
  @Input() disabled = false;

  @Output() clicked = new EventEmitter<void>();

  constructor() {
    addIcons({
      logoApple,
      logoGoogle,
      logoMicrosoft,
    });
  }

  get iconName(): string {
    switch (this.provider) {
      case 'apple':
        return 'logo-apple';

      case 'microsoft':
        return 'logo-microsoft';

      default:
        return 'logo-google';
    }
  }

  get buttonText(): string {
    if (this.text) {
      return this.text;
    }

    switch (this.provider) {
      case 'apple':
        return 'Mit Apple anmelden';

      case 'microsoft':
        return 'Mit Microsoft anmelden';

      default:
        return 'Mit Google anmelden';
    }
  }

  onClick(): void {
    if (this.loading || this.disabled) {
      return;
    }

    this.clicked.emit();
  }
}
