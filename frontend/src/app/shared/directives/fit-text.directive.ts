import {
  AfterViewInit,
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';

@Directive({
  selector: '[flFitText]',
  standalone: true,
})
export class FitTextDirective implements AfterViewInit, OnChanges, OnDestroy {
  @Input() flFitText = '';

  @Input() flFitTextMin = 12;

  @Input() flFitTextMax = 56;

  private resizeObserver?: ResizeObserver;

  private animationFrameId: number | null = null;

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const element = this.elementRef.nativeElement;
    const container = element.parentElement;

    if (!container) {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.scheduleFit();
    });

    this.resizeObserver.observe(container);

    void document.fonts.ready.then(() => {
      this.scheduleFit();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('flFitText' in changes) {
      this.scheduleFit();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private scheduleFit(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.fitText();
    });
  }

  private fitText(): void {
    const element = this.elementRef.nativeElement;
    const container = element.parentElement;

    if (
      !container ||
      container.clientWidth <= 0 ||
      container.clientHeight <= 0
    ) {
      return;
    }

    const text = (this.flFitText || element.textContent || '').trim();

    const minimum = Math.max(10, this.flFitTextMin);

    /*
     * Verhindert, dass mittellange Texte technisch
     * passen, aber unverhältnismäßig riesig wirken.
     */
    const proportionalMaximum = this.getProportionalMaximum(text.length);

    let lowerBound = minimum;

    let upperBound = Math.max(
      minimum,
      Math.min(this.flFitTextMax, proportionalMaximum),
    );

    let bestSize = minimum;

    element.style.width = `${container.clientWidth}px`;
    element.style.maxWidth = `${container.clientWidth}px`;
    element.style.fontSize = `${minimum}px`;

    while (lowerBound <= upperBound) {
      const candidate = Math.floor((lowerBound + upperBound) / 2);

      element.style.fontSize = `${candidate}px`;

      const fitsHorizontally = element.scrollWidth <= container.clientWidth + 1;

      const fitsVertically = element.scrollHeight <= container.clientHeight + 1;

      if (fitsHorizontally && fitsVertically) {
        bestSize = candidate;
        lowerBound = candidate + 1;
      } else {
        upperBound = candidate - 1;
      }
    }

    element.style.fontSize = `${bestSize}px`;
  }

  private getProportionalMaximum(textLength: number): number {
    if (textLength <= 18) {
      return 56;
    }

    if (textLength <= 35) {
      return 46;
    }

    if (textLength <= 60) {
      return 38;
    }

    if (textLength <= 95) {
      return 31;
    }

    if (textLength <= 145) {
      return 25;
    }

    if (textLength <= 220) {
      return 20;
    }

    if (textLength <= 320) {
      return 17;
    }

    return 14;
  }
}
