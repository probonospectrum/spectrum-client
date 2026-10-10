import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaLightbox } from './media-lightbox';

describe('MediaLightbox', () => {
  let component: MediaLightbox;
  let fixture: ComponentFixture<MediaLightbox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaLightbox],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaLightbox);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit close on escape key', () => {
    const spy = vi.fn();
    component.close.subscribe(spy);
    component.onEscape();
    expect(spy).toHaveBeenCalled();
  });

  it('should cycle through multiple items with next and prev', () => {
    component.mediaList = [
      { url: 'https://example.com/img1.jpg', type: 'IMAGE' },
      { url: 'https://example.com/img2.jpg', type: 'IMAGE' },
      { url: 'https://example.com/video.mp4', type: 'VIDEO' },
    ];
    component.ngOnInit();

    expect(component.currentIndex).toBe(0);
    component.next();
    expect(component.currentIndex).toBe(1);
    component.next();
    expect(component.currentIndex).toBe(2);
    component.next();
    expect(component.currentIndex).toBe(0); // cycle

    component.prev();
    expect(component.currentIndex).toBe(2);
  });
});
