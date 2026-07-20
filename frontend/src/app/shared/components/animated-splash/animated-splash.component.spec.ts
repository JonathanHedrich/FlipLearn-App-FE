import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AnimatedSplashComponent } from './animated-splash.component';

describe('AnimatedSplashComponent', () => {
  let component: AnimatedSplashComponent;
  let fixture: ComponentFixture<AnimatedSplashComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AnimatedSplashComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnimatedSplashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
