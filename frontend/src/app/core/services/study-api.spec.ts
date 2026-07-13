import { TestBed } from '@angular/core/testing';

import { StudyApi } from './study-api';

describe('StudyApi', () => {
  let service: StudyApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudyApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
