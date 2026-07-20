import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

@Component({
  selector: 'fl-animated-splash',
  standalone: true,
  templateUrl: './animated-splash.component.html',
  styleUrls: ['./animated-splash.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimatedSplashComponent implements OnInit, OnDestroy {
  @Output() readonly animationFinished = new EventEmitter<void>();

  private finishTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.finishTimer = setTimeout(() => {
      this.animationFinished.emit();
    }, 2600);
  }

  ngOnDestroy(): void {
    if (this.finishTimer !== null) {
      clearTimeout(this.finishTimer);
    }
  }
}
