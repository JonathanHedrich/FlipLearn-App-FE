import { TestBed } from '@angular/core/testing';

import { FlashcardStore } from './flashcard-store';

describe('FlashcardStore', () => {
  let service: FlashcardStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FlashcardStore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
