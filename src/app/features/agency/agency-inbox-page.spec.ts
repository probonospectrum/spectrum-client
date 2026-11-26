import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AgencyInboxPage } from './agency-inbox-page';
import { AgencyInboxService } from '../../core/services/user/agency-inbox.service';
import { PublicAgencyService, AgencyInboxPage as InboxResponse } from '../../core/services/user/public-agency.service';
import { UserService } from '../../core/services/user/user.service';
import { SocialShell } from '../../shared/components/social-shell/social-shell';

@Component({ selector: 'app-social-shell', template: '<ng-content />' })
class StubShell {
  @Input() user: unknown;
  @Input() showContentHeader = false;
  @Output() logout = new EventEmitter<void>();
}

describe('Institutional occurrences page', () => {
  let api: { inbox: ReturnType<typeof vi.fn> };
  const entry = { _id: '66f1c0de0000000000000001', title: 'Buraco na rua', status: 'ABERTA', createdAt: '2026-10-01T12:00:00Z', updatedAt: '2026-10-01T12:00:00Z' };
  beforeEach(async () => {
    vi.useFakeTimers();
    api = { inbox: vi.fn(() => of({ data: [entry], total: 1, nextCursor: null })) };
    await TestBed.configureTestingModule({ imports: [AgencyInboxPage], providers: [
      provideRouter([]),
      { provide: UserService, useValue: { currentUser: signal({ _id: 'institution', accountType: 'PUBLIC_AGENCY' }) } },
      { provide: AgencyInboxService, useValue: { enabled: signal(true), reload: vi.fn() } },
      { provide: PublicAgencyService, useValue: api },
    ] }).overrideComponent(AgencyInboxPage, { remove: { imports: [SocialShell] }, add: { imports: [StubShell] } }).compileComponents();
  });
  afterEach(() => { TestBed.resetTestingModule(); vi.useRealTimers(); });
  function setup() {
    const fixture = TestBed.createComponent(AgencyInboxPage);
    fixture.detectChanges();
    vi.advanceTimersByTime(200);
    fixture.detectChanges();
    return fixture;
  }
  it('opens linked occurrences and sends search, situation and order to the server', () => {
    const fixture = setup();
    const page = fixture.componentInstance;
    expect(fixture.nativeElement.querySelector('.inbox-row').getAttribute('href')).toBe('/ocorrencias/' + entry._id);
    page.search.set('Buraco'); page.filter.set('resolved'); page.order.set('oldest');
    fixture.detectChanges(); vi.advanceTimersByTime(200); fixture.detectChanges();
    expect(api.inbox).toHaveBeenLastCalledWith(undefined, { search: 'Buraco', status: 'resolved', order: 'oldest' });
    expect(fixture.nativeElement.querySelector('[aria-pressed="true"]').textContent).toContain('Resolvidas');
  });
  it('discards stale results when filters change', () => {
    const fixture = setup();
    const previous = new Subject<InboxResponse>();
    api.inbox.mockReturnValueOnce(previous);
    fixture.componentInstance.search.set('antiga');
    fixture.detectChanges(); vi.advanceTimersByTime(200);
    fixture.componentInstance.search.set('atual');
    fixture.detectChanges(); vi.advanceTimersByTime(200);
    previous.next({ data: [], total: 0, nextCursor: null });
    expect(fixture.componentInstance.items()[0]._id).toBe(entry._id);
  });
});
