import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '../constants/api-routes';
import { authGuard } from '../guards/auth.guard';
import { LoggedUser, UserService } from '../services/user/user.service';
import { authInterceptor } from './auth.interceptor';

describe('Authentication session lifecycle', () => {
  const jwt = (exp: number) => `header.${btoa(JSON.stringify({ exp }))}.signature`;
  const session = (token = jwt(Date.now() / 1000 + 3600)) => ({
    token, message: 'ok', user: { _id: 'ana' } as LoggedUser,
  });
  let users: UserService;
  let http: HttpClient;
  let requests: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [
      provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(),
    ] });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => { requests.verify(); localStorage.clear(); });

  it('blocks an expired session restored from the browser and redirects the guard to login', () => {
    localStorage.setItem('spectrum-auth-session', JSON.stringify(session(jwt(Date.now() / 1000 - 1))));
    users = TestBed.inject(UserService);
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result.toString()).toBe('/login');
    expect(users.getCurrentUser()).toBeNull();
    expect(localStorage.getItem('spectrum-auth-session')).toBeNull();
  });

  it.each(['invalid', 'header.!.signature', 'header.e30.signature'])('discards an invalid stored token: %s', token => {
    localStorage.setItem('spectrum-auth-session', JSON.stringify(session(token)));
    expect(TestBed.inject(UserService).isLoggedIn()).toBe(false);
    expect(localStorage.getItem('spectrum-auth-session')).toBeNull();
  });

  it('restores a valid session and clears it if it expires during use', () => {
    vi.useFakeTimers();
    try {
      localStorage.setItem('spectrum-auth-session', JSON.stringify(session()));
      users = TestBed.inject(UserService);
      expect(users.isLoggedIn()).toBe(true);
      vi.advanceTimersByTime(3600001);
      expect(users.isLoggedIn()).toBe(false);
      expect(users.getToken()).toBeNull();
    } finally { vi.useRealTimers(); }
  });

  it('clears a rejected session and navigates to login on API 401', () => {
    users = TestBed.inject(UserService);
    users.saveSession(session());
    const error = vi.fn();
    http.get(`${API_BASE_URL}/posts`).subscribe({ error });
    requests.expectOne(`${API_BASE_URL}/posts`).flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(users.getToken()).toBeNull();
    expect(localStorage.getItem('spectrum-auth-session')).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login', { replaceUrl: true });
    expect(error).toHaveBeenCalled();
  });

  it.each([0, 403, 500])('keeps the session for non-authentication errors (%s)', status => {
    users = TestBed.inject(UserService);
    const current = session();
    users.saveSession(current);
    http.get(`${API_BASE_URL}/posts`).subscribe({ error: () => {} });
    const request = requests.expectOne(`${API_BASE_URL}/posts`);
    if (status === 0) request.error(new ProgressEvent('error'));
    else request.flush({}, { status, statusText: 'Error' });
    expect(users.getToken()).toBe(current.token);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores a late 401 from a previous session', () => {
    users = TestBed.inject(UserService);
    users.saveSession(session());
    http.get(`${API_BASE_URL}/posts`).subscribe({ error: () => {} });
    const request = requests.expectOne(`${API_BASE_URL}/posts`);
    const fresh = session(jwt(Date.now() / 1000 + 7200));
    users.saveSession(fresh);
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(users.getToken()).toBe(fresh.token);
    expect(navigate).not.toHaveBeenCalled();
  });

  it.each([`${API_BASE_URL}/user/login`, `${API_BASE_URL}/auth/google`, `${API_BASE_URL}.example/posts`])(
    'does not attach the stored token or log out on 401 from %s', url => {
      users = TestBed.inject(UserService);
      const current = session();
      users.saveSession(current);
      http.post(url, {}).subscribe({ error: () => {} });
      const request = requests.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({}, { status: 401, statusText: 'Unauthorized' });
      expect(users.getToken()).toBe(current.token);
      expect(navigate).not.toHaveBeenCalled();
    },
  );
});
