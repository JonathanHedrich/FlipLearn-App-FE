import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlashcardListPage } from './flashcard-list.page';

describe('FlashcardListPage', () => {
  let component: FlashcardListPage;
  let fixture: ComponentFixture<FlashcardListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FlashcardListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
