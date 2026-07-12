import { Component, Input } from '@angular/core';

@Component({
  selector: 'fl-logo',
  templateUrl: './fl-logo.component.html',
  styleUrl: './fl-logo.component.scss',
  standalone: true,
})
export class FlLogoComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showText = false;
  @Input() light = true;
}
