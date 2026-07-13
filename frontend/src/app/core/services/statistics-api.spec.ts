import { TestBed } from '@angular/core/testing';

import { StatisticsApi } from './statistics-api';

describe('StatisticsApi', () => {
  let service: StatisticsApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatisticsApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
