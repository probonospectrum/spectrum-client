import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { PostCard } from './post-card';
import { PostService, SpectrumPost } from '../../../core/services/posts/post.service';
import { LoggedUser } from '../../../core/services/user/user.service';
import { Subject } from 'rxjs';

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

  it('updates the comment count without accumulating duplicate counts', () => {
    component.onCommentCountChanged(3);
    expect(component.commentsCount).toBe(3);
    component.onCommentCountChanged(3);
    expect(component.commentsCount).toBe(3);
    component.onCommentCountChanged(2);
    expect(component.commentsCount).toBe(2);
  });

  it.each(['LIKE', 'UNLIKE'] as const)('renders the saved %s after one click and ignores clicks while saving', async reaction => {
    const response = new Subject<SpectrumPost>();
    const save = vi.spyOn(TestBed.inject(PostService), 'setPostReaction').mockReturnValue(response);
    component.currentUser = { _id: 'user' } as LoggedUser;
    const label = reaction === 'LIKE' ? 'Curtir publicacao' : 'Descurtir publicacao';
    const button = fixture.nativeElement.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
    button.click();
    if (reaction === 'LIKE') component.toggleLike(); else component.toggleDislike();
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(expect.anything(), component.currentUser, reaction);
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    response.next({ ...basePost, likes: reaction === 'LIKE' ? 6 : 5, dislikes: reaction === 'UNLIKE' ? 1 : 0,
      liked: reaction === 'LIKE', disliked: reaction === 'UNLIKE', reaction });
    response.complete();
    await fixture.whenStable();
    expect(button.disabled).toBe(false);
    expect(button.classList.contains(reaction === 'LIKE' ? 'post-card__action--liked' : 'post-card__action--disliked')).toBe(true);
    expect(button.textContent).toContain(reaction === 'LIKE' ? '6' : '1');
  });

  it('keeps the previous state and displays a persistence failure without another click', async () => {
    const response = new Subject<SpectrumPost>();
    vi.spyOn(TestBed.inject(PostService), 'setPostReaction').mockReturnValue(response);
    component.currentUser = { _id: 'user' } as LoggedUser;
    component.toggleLike();
    response.error(new Error('Unavailable'));
    await fixture.whenStable();
    expect(component.post.liked).toBe(false);
    expect(component.post.likes).toBe(5);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Não foi possível salvar');
    expect(component.reactionPending).toBe(false);
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

