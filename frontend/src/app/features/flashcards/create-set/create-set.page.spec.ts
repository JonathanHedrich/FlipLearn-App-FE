import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateSetPage } from './create-set.page';

describe('CreateSetPage', () => {
  let component: CreateSetPage;
  let fixture: ComponentFixture<CreateSetPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
