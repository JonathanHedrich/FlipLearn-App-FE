import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditSetPage } from './edit-set.page';

describe('EditSetPage', () => {
  let component: EditSetPage;
  let fixture: ComponentFixture<EditSetPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSetPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
