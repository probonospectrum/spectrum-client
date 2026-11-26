import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../constants/api-routes';
import { authInterceptor } from '../../interceptors/auth.interceptor';
import { UserService, LoggedUser } from './user.service';

describe('Follow API integration', () => {
  let service: UserService;
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()] });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
    service.saveSession({ token: 'token', message: 'ok', user: { _id: 'owner', name: 'Ana', following: [] } as unknown as LoggedUser });
  });
  afterEach(() => http.verify());

  it('loads both list directions with the authenticated token', () => {
    for (const type of ['followers', 'following'] as const) {
      service.getConnections('target', type).subscribe(users => expect(users[0].nickname).toBe('bruno'));
      const req = http.expectOne(API_BASE_URL + '/follows/target/' + type);
      expect(req.request.headers.get('Authorization')).toBe('Bearer token');
      req.flush([{ _id: 'friend', name: 'Bruno', nickname: 'bruno', isFollowing: false }]);
    }
  });

  it('persists the following array returned by a successful follow', () => {
    service.followUser('target', true).subscribe();
    const req = http.expectOne(API_BASE_URL + '/user/owner/follow/target');
    expect(req.request.method).toBe('PATCH');
    expect(service.getCurrentUser()?.following).toEqual([]);
    req.flush({ user: { ...service.getCurrentUser(), following: ['target'] }, isFollowing: true });
    expect(service.getCurrentUser()?.following).toEqual(['target']);
  });

  it('removes a follower through the authenticated owner endpoint', () => {
    service.removeFollower('friend').subscribe();
    const req = http.expectOne(API_BASE_URL + '/follows/me/followers/friend');
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token');
    req.flush({ message: 'ok' });
  });
});
