import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudySessionPage } from './study-session.page';

describe('StudySessionPage', () => {
  let component: StudySessionPage;
  let fixture: ComponentFixture<StudySessionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StudySessionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
