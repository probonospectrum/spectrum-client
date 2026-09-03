import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpectrumInput } from './input';

describe('Input', () => {
  let component: SpectrumInput;
  let fixture: ComponentFixture<SpectrumInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpectrumInput],
    }).compileComponents();

    fixture = TestBed.createComponent(SpectrumInput);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
