import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../constants/api-routes';
import { PostService } from './post.service';
import { SpectrumPost } from './post.service';
import { LoggedUser } from '../user/user.service';

describe('Occurrence feed API', () => {
  let posts: PostService;
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    posts = TestBed.inject(PostService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('persists reactions before updating counts and does not add the local reaction twice', () => {
    const id = '66f1c0de0000000000000001';
    const post = { id, likes: 4, dislikes: 1, liked: false, disliked: false, evidences: [], history: [], tags: [] } as unknown as SpectrumPost;
    const user = { _id: '66f1c0de0000000000000002' } as LoggedUser;
    let result: SpectrumPost | undefined;
    posts.setPostReaction(post, user, 'LIKE').subscribe(value => result = value);
    const request = http.expectOne(API_BASE_URL + '/like/post/' + id);
    expect(request.request.method).toBe('PUT');
    expect(result).toBeUndefined();
    request.flush({ likes: 5, dislikes: 1, liked: true, disliked: false });
    expect(result?.likes).toBe(5);
    expect(posts.findPostById(id, user)?.likes).toBe(5);
    expect(posts.findPostById(id, user)?.liked).toBe(true);
  });

  it('preserves the old reaction state when persistence fails', () => {
    const id = '66f1c0de0000000000000001';
    const post = { id, likes: 4, liked: false } as SpectrumPost;
    let failed = false;
    posts.setPostReaction(post, { _id: 'user' } as LoggedUser, 'LIKE').subscribe({ error: () => failed = true });
    http.expectOne(API_BASE_URL + '/like/post/' + id).flush({}, { status: 503, statusText: 'Unavailable' });
    expect(failed).toBe(true);
    expect(post.liked).toBe(false);
    expect(localStorage.getItem('spectrum-post-interactions')).toBeNull();
  });

  it('shows the real author and occurrence history and passes the pagination cursor', () => {
    const id = '66f1c0de0000000000000001';
    let data: any;
    posts.getFeed(null, 'next-page').subscribe((page) => data = page);
    const request = http.expectOne((r) => r.url === API_BASE_URL + '/feed');
    expect(request.request.params.get('scope')).toBe('all');
    expect(request.request.params.get('cursor')).toBe('next-page');
    request.flush({ data: [{ _id: id, createdBy: '66f1c0de0000000000000002', text: 'Poste apagado', title: 'Iluminacao', status: 'ABERTA', importance: 'ALTA', category: 'ILUMINACAO_PUBLICA', createdAt: '2026-10-05T10:00:00Z', location: { label: 'Rua A' }, author: { _id: '66f1c0de0000000000000002', name: 'Bruno Silva', nickname: 'bruno', avatarUrl: 'https://example.test/avatar.png', cityUser: 'Recife' }, evidences: [], history: [], confirmedByIds: ['66f1c0de0000000000000003'] }], hasMore: true, nextCursor: 'page-2' });
    expect(data.data[0].authorName).toBe('Bruno Silva');
    expect(data.data[0].authorNickname).toBe('bruno');
    expect(data.data[0].confirmedByIds).toHaveLength(1);
    expect(data.nextCursor).toBe('page-2');
  });

  it('does not replace an empty feed or server failure with local posts', () => {
    localStorage.setItem('spectrum-mock-posts', JSON.stringify([{ id: 'mock-old' }]));
    let result: any;
    posts.getFeed(null).subscribe((page) => result = page.data);
    http.expectOne((r) => r.url === API_BASE_URL + '/feed').flush({ data: [], hasMore: false, nextCursor: null });
    expect(result).toEqual([]);
    expect(posts.getPosts()).toEqual([]);
    let failed = false;
    posts.getFeed(null).subscribe({ error: () => failed = true });
    http.expectOne((r) => r.url === API_BASE_URL + '/feed').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(failed).toBe(true);
  });

  it('restores the reaction after reload without local storage and accepts removal from the server', () => {
    const id = '66f1c0de0000000000000001';
    const user = { _id: '66f1c0de0000000000000002' } as LoggedUser;
    const response = { _id: id, text: 'Post', createdAt: '2026-10-06T12:00:00Z', likeCount: 3, unlikeCount: 1, reaction: 'LIKE' };
    let loaded: SpectrumPost | undefined;
    posts.getFeed(user).subscribe(page => loaded = page.data[0]);
    http.expectOne(r => r.url === API_BASE_URL + '/feed').flush({ data: [response], nextCursor: null, hasMore: false });
    expect(loaded).toMatchObject({ likes: 3, dislikes: 1, liked: true, disliked: false });
    localStorage.clear();
    posts.getFeed(user).subscribe(page => loaded = page.data[0]);
    http.expectOne(r => r.url === API_BASE_URL + '/feed').flush({ data: [response], nextCursor: null, hasMore: false });
    expect(loaded).toMatchObject({ likes: 3, liked: true });
    posts.setPostReaction(loaded!, user, 'LIKE').subscribe();
    http.expectOne(API_BASE_URL + '/like/post/' + id).flush({ likes: 3, dislikes: 1, liked: true, disliked: false });
    posts.getFeed(user).subscribe(page => loaded = page.data[0]);
    http.expectOne(r => r.url === API_BASE_URL + '/feed').flush({ data: [{ ...response, likeCount: 2, reaction: null }], nextCursor: null, hasMore: false });
    expect(loaded).toMatchObject({ likes: 2, liked: false, disliked: false });
  });
});
