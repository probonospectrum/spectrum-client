import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InterestsPage } from './interests-page';

describe('InterestsPage', () => {
  let component: InterestsPage;
  let fixture: ComponentFixture<InterestsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterestsPage],
    }).compileComponents();

    fixture = TestBed.createComponent(InterestsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle interest selection', () => {
    const interest = component.interests[0];
    expect(component.isSelected(interest)).toBe(false);

    component.toggleInterest(interest);
    expect(component.isSelected(interest)).toBe(true);

    component.toggleInterest(interest);
    expect(component.isSelected(interest)).toBe(false);
  });

  it('should not emit fechou when nothing is selected', () => {
    vi.spyOn(component.fechou, 'emit');
    component.continue();
    expect(component.fechou.emit).not.toHaveBeenCalled();
  });

  it('should emit fechou with selected interests on continue', () => {
    vi.spyOn(component.fechou, 'emit');
    component.toggleInterest(component.interests[0]);
    component.continue();
    expect(component.fechou.emit).toHaveBeenCalledWith([component.interests[0].id]);
  });
});