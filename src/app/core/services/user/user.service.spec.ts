import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../constants/api-routes';
import { authInterceptor } from '../../interceptors/auth.interceptor';
import { LoggedUser, UserService } from './user.service';

describe('UserService avatar upload', () => {
  const session = { token: 'session-token', message: 'login', user: { _id: 'ana', name: 'Ana', avatarUrl: 'https://example.com/old.png', following: ['friend'] } as LoggedUser };
  let service: UserService;
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()] });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
    service.saveSession(session);
  });
  afterEach(() => http.verify());

  it('sends multipart and bearer token and persists only the returned URL after success', () => {
    service.uploadAvatar(new Blob(['photo'], { type: 'image/png' })).subscribe();
    const request = http.expectOne(API_BASE_URL + '/user/ana/avatar');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body instanceof FormData).toBe(true);
    expect(request.request.body.get('avatar').name).toBe('avatar.png');
    expect(request.request.headers.has('Content-Type')).toBe(false);
    expect(request.request.headers.get('Authorization')).toBe('Bearer session-token');
    expect(service.getCurrentUser()).toEqual(session.user);
    request.flush({ message: 'ok', avatarUrl: 'https://example.com/new.png' });
    const expected = { ...session, user: { ...session.user, avatarUrl: 'https://example.com/new.png' } };
    expect(JSON.parse(localStorage.getItem('spectrum-auth-session')!)).toEqual(expected);
    expect(service.getCurrentUser()).toEqual(expected.user);
    expect(new UserService(TestBed.inject(HttpClient)).getCurrentUser()).toEqual(expected.user);
  });

  it('removes the avatar and persists the default avatar after reloading', () => {
    service.removeAvatar().subscribe();
    const request = http.expectOne(API_BASE_URL + '/user/ana/avatar');
    expect(request.request.method).toBe('DELETE');
    expect(request.request.headers.get('Authorization')).toBe('Bearer session-token');
    expect(service.getCurrentUser()).toEqual(session.user);
    request.flush({ message: 'ok', avatarUrl: '' });
    expect(service.getCurrentUser()?.avatarUrl).toBe('');
    expect(new UserService(TestBed.inject(HttpClient)).getCurrentUser()?.avatarUrl).toBe('');
    expect(service.getCurrentUser()?.following).toEqual(['friend']);
  });

  it('preserves the photo when removal fails', () => {
    service.removeAvatar().subscribe({ error: () => {} });
    http.expectOne(API_BASE_URL + '/user/ana/avatar').flush({}, { status: 500, statusText: 'Error' });
    expect(service.getCurrentUser()).toEqual(session.user);
  });

  it('does not restore a logged out session after removal', () => {
    service.removeAvatar().subscribe();
    const request = http.expectOne(API_BASE_URL + '/user/ana/avatar');
    service.logout();
    request.flush({ message: 'ok', avatarUrl: '' });
    expect(service.getCurrentUser()).toBeNull();
  });

  it('preserves the session on failure', () => {
    const error = vi.fn();
    service.uploadAvatar(new Blob(['photo'])).subscribe({ error });
    http.expectOne(API_BASE_URL + '/user/ana/avatar').flush({}, { status: 500, statusText: 'Error' });
    expect(error).toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem('spectrum-auth-session')!)).toEqual(session);
    expect(service.getCurrentUser()).toEqual(session.user);
  });

  it('does not overwrite another account when a response arrives late', () => {
    service.uploadAvatar(new Blob(['photo'])).subscribe();
    const request = http.expectOne(API_BASE_URL + '/user/ana/avatar');
    const other = { ...session, user: { ...session.user, _id: 'other' } };
    service.saveSession(other);
    request.flush({ message: 'ok', avatarUrl: 'https://example.com/new.png' });
    expect(service.getCurrentUser()).toEqual(other.user);
  });
});
