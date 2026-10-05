import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../constants/api-routes';
import { PostService } from './post.service';

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
});
