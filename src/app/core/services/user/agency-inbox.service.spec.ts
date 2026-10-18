import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AgencyInboxService } from './agency-inbox.service';
import { UserService, LoggedUser } from './user.service';
import { NotificationService } from '../notifications/notification.service';
import { API_BASE_URL } from '../../constants/api-routes';

describe('Institutional inbox session and pagination', () => {
  const user = signal<LoggedUser | null>(null);
  let http: HttpTestingController;
  let inbox: AgencyInboxService;
  const url = `${API_BASE_URL}/post/agency/inbox`;
  beforeEach(() => {
    vi.useFakeTimers();
    user.set({
      _id: 'representative',
      occurrenceRole: 'RESPONSIBLE_AGENCY',
      occurrenceAgencyId: 'agency',
      agencyRegistrationStatus: 'APPROVED',
    } as LoggedUser);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: { currentUser: user } },
        { provide: NotificationService, useValue: { notifications: signal([]) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    inbox = TestBed.inject(AgencyInboxService);
    TestBed.tick();
    vi.advanceTimersByTime(1);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });
  it('keeps resolved records, loads older pages and clears private data on account change', () => {
    http
      .expectOne(url)
      .flush({
        data: [{ _id: 'b', title: 'Resolvida', status: 'RESOLVIDA' }],
        total: 2,
        nextCursor: 'b',
      });
    expect(inbox.items()[0].status).toBe('RESOLVIDA');
    inbox.loadMore();
    http
      .expectOne(`${url}?cursor=b`)
      .flush({
        data: [{ _id: 'a', title: 'Antiga', status: 'ABERTA' }],
        total: 2,
        nextCursor: null,
      });
    expect(inbox.items()).toHaveLength(2);
    user.set({ _id: 'citizen', occurrenceRole: 'USER' } as LoggedUser);
    TestBed.tick();
    expect(inbox.items()).toEqual([]);
    expect(inbox.total()).toBe(0);
    expect(inbox.enabled()).toBe(false);
    http.expectNone(url);
  });
  it('preserves the visible list on a temporary refresh failure', () => {
    http
      .expectOne(url)
      .flush({
        data: [{ _id: 'a', title: 'Relato', status: 'ABERTA' }],
        total: 1,
        nextCursor: null,
      });
    inbox.reload();
    http.expectOne(url).flush({}, { status: 500, statusText: 'Error' });
    expect(inbox.items()).toHaveLength(1);
    expect(inbox.error()).toBeTruthy();
  });
});
