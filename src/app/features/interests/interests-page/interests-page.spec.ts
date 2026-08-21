import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterestsPage } from './interests-page';

describe('InterestsPage', () => {
  let component: InterestsPage;
  let fixture: ComponentFixture<InterestsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterestsPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterestsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
