import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PostCard } from './post-card';
import { SpectrumPost } from '../../../core/services/posts/post.service';

describe('PostCard media and gallery layout', () => {
  let component: PostCard;
  let fixture: ComponentFixture<PostCard>;

  const basePost: SpectrumPost = {
    id: 'post-1',
    createdAt: '2026-10-09T12:00:00.000Z',
    publishedAt: '2026-10-09T12:00:00.000Z',
    publishedAtLabel: 'Hoje',
    authorName: 'Maria Silva',
    authorNickname: 'mariasilva',
    authorInitial: 'M',
    authorCity: 'São Paulo - SP',
    title: 'Buraco na via pública',
    content: 'Problema no asfalto da Rua Exemplo.',
    mediaType: 'image',
    likes: 5,
    dislikes: 0,
    liked: false,
    disliked: false,
    comments: 2,
    reposts: 0,
    reposted: false,
    saved: false,
    tags: ['infraestrutura'],
    status: 'ABERTA',
    importance: 'ALTA',
    evidences: [
      {
        id: 'ev-1',
        type: 'IMAGE',
        url: 'https://example.com/photo1.jpg',
        addedAt: '2026-10-09T12:00:00.000Z',
      },
      {
        id: 'ev-2',
        type: 'IMAGE',
        url: 'https://example.com/photo2.jpg',
        addedAt: '2026-10-09T12:00:00.000Z',
      },
    ],
    forwardingHistory: [],
    confirmedByIds: [],
    history: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostCard],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PostCard);
    component = fixture.componentInstance;
    component.post = { ...basePost };
    fixture.detectChanges();
  });

  it('should create post card component', () => {
    expect(component).toBeTruthy();
  });

  it('should parse media evidences into gallery items', () => {
    expect(component.galleryItems.length).toBe(2);
    expect(component.galleryItems[0].url).toBe('https://example.com/photo1.jpg');
    expect(component.galleryItems[1].url).toBe('https://example.com/photo2.jpg');
  });

  it('should open media lightbox when openGalleryMedia is triggered', () => {
    const fakeEvent = new MouseEvent('click');
    component.openGalleryMedia(fakeEvent, 1);
    expect(component.lightboxOpen).toBe(true);
    expect(component.lightboxIndex).toBe(1);

    component.closeGalleryLightbox();
    expect(component.lightboxOpen).toBe(false);
  });

  it('should render media grid when there are multiple media items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const grid = compiled.querySelector('.post-card__media-grid');
    expect(grid).toBeTruthy();
    expect(grid?.classList.contains('post-card__media-grid--2')).toBe(true);
  });

  it('should keep the lightbox outside the transformed card and close it from the backdrop', () => {
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLElement>('.post-card__grid-item')!.click();
    fixture.detectChanges();

    const lightbox = element.querySelector('app-media-lightbox');
    expect(lightbox).toBeTruthy();
    expect(lightbox?.closest('.post-card')).toBeNull();

    lightbox!.querySelector<HTMLElement>('.media-lightbox')!.click();
    fixture.detectChanges();
    expect(element.querySelector('app-media-lightbox')).toBeNull();
  });
});

