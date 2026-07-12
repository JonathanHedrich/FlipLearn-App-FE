import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlashcardDetailPage } from './flashcard-detail.page';

describe('FlashcardDetailPage', () => {
  let component: FlashcardDetailPage;
  let fixture: ComponentFixture<FlashcardDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FlashcardDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
