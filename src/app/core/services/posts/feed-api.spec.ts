import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../constants/api-routes';
import { PostService } from './post.service';
import { SpectrumComment, SpectrumPost } from './post.service';
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

  it.each(['LIKE', 'UNLIKE'] as const)('restores %s and saved state in occurrence details despite obsolete local storage', reaction => {
    const id = '66f1c0de0000000000000001';
    localStorage.setItem('spectrum-post-interactions', JSON.stringify([{ postId: id, userId: 'actor', liked: false, disliked: false, saved: false }]));
    let result: SpectrumPost | undefined;
    posts.getOccurrence(id, { _id: 'actor' } as LoggedUser).subscribe(post => result = post);
    http.expectOne(API_BASE_URL + '/post/' + id).flush({ _id: id, text: 'Post', createdAt: '2026-10-12T12:00:00Z', likeCount: 0 });
    http.expectOne(r => r.url === API_BASE_URL + '/like/post-states').flush({ [id]: { likeCount: 2, unlikeCount: 1, reaction, saved: true } });
    expect(result).toMatchObject({ likes: 2, dislikes: 1, liked: reaction === 'LIKE', disliked: reaction === 'UNLIKE', saved: true });
  });

  it('persists saving through the backend without changing the reaction', () => {
    const post = { id: '66f1c0de0000000000000001', saved: false, liked: true, reaction: 'LIKE' } as SpectrumPost;
    let result: SpectrumPost | undefined;
    posts.setPostSaved(post, { _id: 'actor' } as LoggedUser, true).subscribe(value => result = value);
    const request = http.expectOne(API_BASE_URL + '/like/post/' + post.id + '/saved');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ saved: true });
    expect(result).toBeUndefined();
    request.flush({ saved: true });
    expect(result).toMatchObject({ saved: true, liked: true, reaction: 'LIKE' });
    expect(result).toBe(post);
  });

  it('updates only repost metadata and preserves other interactions after repost and undo', () => {
    const id = '66f1c0de0000000000000001';
    const post = { id, likes: 8, dislikes: 2, liked: true, disliked: false, saved: true, comments: 3,
      reposts: 4, reposted: false, history: [{ id: 'history' }], evidences: [{ id: 'evidence' }] } as unknown as SpectrumPost;
    const user = { _id: 'actor' } as LoggedUser;
    for (const [reposted, count] of [[true, 5], [false, 4]] as const) {
      let result: any;
      posts.toggleServerRepost(post, user).subscribe(value => result = value);
      http.expectOne(API_BASE_URL + '/post/' + id + '/repost/toggle').flush({
        post: { _id: id, likeCount: 0, unlikeCount: 0 }, reposted, repostCount: count,
      });
      expect(result.post).toBe(post);
      expect(post).toMatchObject({ reposts: count, reposted, likes: 8, dislikes: 2, liked: true, saved: true, comments: 3 });
      expect(post.history).toEqual([{ id: 'history' }]);
      expect(post.evidences).toEqual([{ id: 'evidence' }]);
    }
  });

  it('restores server repost state after reload without counting obsolete local reposts', () => {
    const id = '66f1c0de0000000000000001';
    localStorage.setItem('spectrum-reposts', JSON.stringify([{ userId: 'actor', originalPostId: id }]));
    let loaded: SpectrumPost | undefined;
    posts.getFeed({ _id: 'actor' } as LoggedUser).subscribe(page => loaded = page.data[0]);
    http.expectOne(r => r.url === API_BASE_URL + '/feed').flush({ data: [{ _id: id, text: 'Post', repostCount: 7, reposted: false }], hasMore: false, nextCursor: null });
    expect(loaded?.reposts).toBe(7);
    expect(loaded?.reposted).toBe(false);
  });

  it('preserves interactions and repost state when repost persistence fails', () => {
    const post = { id: '66f1c0de0000000000000001', reposts: 2, reposted: false, liked: true, saved: true } as SpectrumPost;
    posts.toggleServerRepost(post, null).subscribe({ error: () => {} });
    http.expectOne(API_BASE_URL + '/post/' + post.id + '/repost/toggle').flush({}, { status: 500, statusText: 'Error' });
    expect(post).toMatchObject({ reposts: 2, reposted: false, liked: true, saved: true });
  });

  it('shows the original author and content in a profile repost while retaining repost ownership', () => {
    const originalId = '66f1c0de0000000000000001';
    const repostId = '66f1c0de0000000000000002';
    const owner = { _id: 'profile-owner', name: 'Ana', nickname: 'ana', avatarUrl: '/ana.png' };
    let result: SpectrumPost[] = [];
    posts.getAuthorPosts(owner, owner as LoggedUser).subscribe(value => result = value);
    http.expectOne(r => r.url === API_BASE_URL + '/post/user/profile-owner').flush([
      { _id: repostId, originalPostId: originalId, createdBy: owner._id, title: 'Repost: título', text: '', repostCount: 4, reposted: true },
    ]);
    http.expectOne(r => r.url === API_BASE_URL + '/like/post-states').flush({ [originalId]: { likeCount: 2, unlikeCount: 0, reaction: 'LIKE', saved: true } });
    http.expectOne(API_BASE_URL + '/post/' + originalId).flush({
      _id: originalId, createdBy: 'original-author', title: 'Ocorrência original', text: 'Problema na rua',
      author: { _id: 'original-author', name: 'Bruno', nickname: 'bruno', avatarUrl: '/bruno.png' },
      repostCount: 4, reposted: true, evidences: [], history: [],
    });
    http.expectOne(r => r.url === API_BASE_URL + '/like/post-states').flush({ [originalId]: { likeCount: 2, unlikeCount: 0, reaction: 'LIKE', saved: true } });
    expect(result[0]).toMatchObject({ id: repostId, originalPostId: originalId, createdBy: owner._id,
      authorName: 'Bruno', authorNickname: 'bruno', authorAvatarUrl: '/bruno.png', title: 'Ocorrência original',
      content: 'Problema na rua', reposts: 4, reposted: true, liked: true, saved: true });
  });

  it('returns an empty profile list without waiting for original occurrence requests', () => {
    let result: SpectrumPost[] | undefined;
    posts.getAuthorPosts({ _id: 'owner', name: 'Ana', nickname: 'ana' }, null).subscribe(value => result = value);
    http.expectOne(r => r.url === API_BASE_URL + '/post/user/owner').flush([]);
    expect(result).toEqual([]);
  });

  it('sends comment reactions to the backend and uses the saved state', () => {
    const comment = { id: 'comment', likes: 2, dislikes: 1, liked: false, disliked: true } as SpectrumComment;
    let result: SpectrumComment | undefined;
    posts.setCommentReaction(comment, 'LIKE').subscribe(value => result = value);
    const request = http.expectOne(API_BASE_URL + '/like/comment/comment');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ reaction: 'LIKE' });
    expect(result).toBeUndefined();
    request.flush({ likes: 3, dislikes: 0, liked: true, disliked: false });
    expect(result).toMatchObject({ likes: 3, dislikes: 0, liked: true, disliked: false });
    expect(comment.liked).toBe(false);
  });

  it('loads comment reactions from the backend after reopening comments', () => {
    let result: SpectrumComment[] = [];
    posts.loadComments('post').subscribe(value => result = value);
    http.expectOne(API_BASE_URL + '/comment/post/post').flush([
      { _id: 'comment', userId: 'owner', text: 'Comentário', createdAt: '2026-10-10T12:00:00Z', author: { name: 'Ana' } },
    ]);
    http.expectOne(API_BASE_URL + '/like/comment/post/post').flush({ comment: { likes: 3, dislikes: 0, liked: true, disliked: false } });
    expect(result[0]).toMatchObject({ id: 'comment', likes: 3, liked: true });
  });

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
    expect(result).toBe(post);
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
    const response = { _id: id, text: 'Post', createdAt: '2026-10-06T12:00:00Z', likeCount: 3, unlikeCount: 1, reaction: 'LIKE', commentCount: 1 };
    let loaded: SpectrumPost | undefined;
    posts.getFeed(user).subscribe(page => loaded = page.data[0]);
    http.expectOne(r => r.url === API_BASE_URL + '/feed').flush({ data: [response], nextCursor: null, hasMore: false });
    expect(loaded).toMatchObject({ likes: 3, dislikes: 1, liked: true, disliked: false });
    localStorage.clear();
    posts.getFeed(user).subscribe(page => loaded = page.data[0]);
    http.expectOne(r => r.url === API_BASE_URL + '/feed').flush({ data: [response], nextCursor: null, hasMore: false });
    expect(loaded).toMatchObject({ likes: 3, liked: true, comments: 1 });
    posts.setPostReaction(loaded!, user, 'LIKE').subscribe();
    http.expectOne(API_BASE_URL + '/like/post/' + id).flush({ likes: 3, dislikes: 1, liked: true, disliked: false });
    posts.getFeed(user).subscribe(page => loaded = page.data[0]);
    http.expectOne(r => r.url === API_BASE_URL + '/feed').flush({ data: [{ ...response, likeCount: 2, reaction: null }], nextCursor: null, hasMore: false });
    expect(loaded).toMatchObject({ likes: 2, liked: false, disliked: false });
  });
});
