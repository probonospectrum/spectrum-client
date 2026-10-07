import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { API_BASE_URL } from '../../constants/api-routes';
import { UserService } from '../user/user.service';
import { NotificationService } from './notification.service';
const socketMock = vi.hoisted(() => ({
  handlers: {} as Record<string, () => void>,
  disconnect: vi.fn(),
  io: vi.fn(),
}));
vi.mock('socket.io-client', () => ({ io: socketMock.io }));
describe('Live notifications', () => {
  let http: HttpTestingController;
  let service: NotificationService;
  let users: UserService;
  const url = API_BASE_URL + '/notifications';
  const item = {
    id: 'n1',
    type: 'like',
    title: 'Curtida',
    description: 'Curtiram sua ocorrência',
    read: false,
    createdAt: '2026-10-05T12:00:00Z',
    postId: 'post1',
  };
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    socketMock.handlers = {};
    socketMock.io.mockReturnValue({
      on: (name: string, handler: () => void) => (socketMock.handlers[name] = handler),
      disconnect: socketMock.disconnect,
    });
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    users = TestBed.inject(UserService);
    users.saveSession({
      token: 'session-token',
      message: 'ok',
      user: {
        _id: 'user1',
        name: 'Ana',
        nickname: 'ana',
        email: 'ana@example.test',
        birthDate: '2000-01-01',
      },
    });
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
    vi.advanceTimersByTime(100);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });
  function firstPage() {
    http.expectOne(url).flush({ data: [item], nextCursor: null, unreadCount: 1 });
  }
  it('loads saved notifications and authenticates the socket', () => {
    firstPage();
    expect(service.notifications()[0].postId).toBe('post1');
    expect(service.unreadCount()).toBe(1);
    expect(socketMock.io).toHaveBeenCalledWith(
      API_BASE_URL + '/realtime',
      expect.objectContaining({ auth: { token: 'session-token' } }),
    );
  });
  it('refreshes on incoming events and reconnection without duplicating items', () => {
    firstPage();
    socketMock.handlers['notification:created']();
    socketMock.handlers['connect']();
    vi.advanceTimersByTime(100);
    firstPage();
    expect(service.notifications()).toHaveLength(1);
  });
  it('does not mark items read when the API rejects the operation', () => {
    firstPage();
    service.markRead('n1');
    http.expectOne(url + '/n1/read').flush({}, { status: 500, statusText: 'Failed' });
    expect(service.notifications()[0].read).toBe(false);
    expect(service.error()).toBeTruthy();
  });
  it('clears notifications and disconnects on logout', () => {
    firstPage();
    users.logout();
    TestBed.tick();
    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
    expect(socketMock.disconnect).toHaveBeenCalled();
  });
});
