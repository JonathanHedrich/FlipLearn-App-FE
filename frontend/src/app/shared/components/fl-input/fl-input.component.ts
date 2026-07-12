import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonIcon, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';

@Component({
  selector: 'fl-input',
  standalone: true,
  imports: [CommonModule, IonIcon, IonInput],
  templateUrl: './fl-input.component.html',
  styleUrls: ['./fl-input.component.scss'],
})
export class FlInputComponent {
  @Input() label = '';
  @Input() type: 'text' | 'email' | 'password' = 'text';
  @Input() icon = '';
  @Input() placeholder = '';
  @Input() autocomplete = '';
  @Input() value = '';
  @Input() invalid = false;
  @Input() errorMessage = '';

  @Output() valueChange = new EventEmitter<string>();

  passwordVisible = false;

  constructor() {
    addIcons({
      eyeOffOutline,
      eyeOutline,
    });
  }

  get currentType(): 'text' | 'email' | 'password' {
    if (this.type !== 'password') {
      return this.type;
    }

    return this.passwordVisible ? 'text' : 'password';
  }

  onInput(event: CustomEvent): void {
    const value = String(event.detail.value ?? '');

    this.value = value;
    this.valueChange.emit(value);
  }

  togglePassword(): void {
    this.passwordVisible = !this.passwordVisible;
  }
}
