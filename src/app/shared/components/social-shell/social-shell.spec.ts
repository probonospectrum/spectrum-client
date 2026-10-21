import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';
import { SocialShell } from './social-shell';
import { UserService } from '../../../core/services/user/user.service';
import { NotificationService } from '../../../core/services/notifications/notification.service';
import { AgencyInboxService } from '../../../core/services/user/agency-inbox.service';
import { signal } from '@angular/core';

describe('SocialShell profile search', () => {
  let api: { searchProfiles: ReturnType<typeof vi.fn> };
  const occurrenceTotal = signal(0);

  beforeEach(() => {
    vi.useFakeTimers();
    occurrenceTotal.set(0);
    api = { searchProfiles: vi.fn().mockReturnValue(of([{ name: 'Maria', nickname: 'mariazinha', avatarUrl: 'https://example.test/maria.png' }])) };
    TestBed.configureTestingModule({ providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      { provide: UserService, useValue: { ...api, currentUser: () => null } },
      { provide: NotificationService, useValue: { notifications: () => [], unreadCount: () => 0 } },
      { provide: AgencyInboxService, useValue: { enabled: () => true, total: occurrenceTotal } },
    ] });
  });
  afterEach(() => vi.useRealTimers());

  it('shows the notification-style red badge on the occurrences link and caps it at 99+', () => {
    const fixture = TestBed.createComponent(SocialShell);
    fixture.detectChanges();
    const link = fixture.nativeElement.querySelector('a[href="/orgao-publico/caixa-de-entrada"]');
    expect(link.querySelector('.social-nav__notification-badge')).toBeNull();
    occurrenceTotal.set(7);
    fixture.detectChanges();
    expect(link.querySelector('.social-nav__notification-icon .social-nav__notification-badge').textContent.trim()).toBe('7');
    occurrenceTotal.set(100);
    fixture.detectChanges();
    expect(link.querySelector('.social-nav__notification-badge').textContent.trim()).toBe('99+');
  });

  it('finds a server profile without cached posts, suggestions or visiting the profile', () => {
    const shell = TestBed.runInInjectionContext(() => new SocialShell());
    shell.searchTerm.set(' mariazinha ');
    shell.onSearch();
    expect(shell.isSearching()).toBe(true);
    vi.advanceTimersByTime(300);
    expect(api.searchProfiles).toHaveBeenCalledWith('mariazinha');
    expect(shell.searchResults()).toContainEqual({
      id: 'profile:mariazinha', name: 'Maria', nickname: 'mariazinha', avatarUrl: 'https://example.test/maria.png', type: 'Pessoa',
    });
    expect(shell.isSearching()).toBe(false);
  });

  it('ignores an old response after the query changes or is cleared', () => {
    const old = new Subject<{ name: string; nickname: string }[]>();
    api.searchProfiles.mockReturnValueOnce(old);
    const shell = TestBed.runInInjectionContext(() => new SocialShell());
    shell.searchTerm.set('maria');
    shell.onSearch();
    vi.advanceTimersByTime(300);
    shell.searchTerm.set('outro');
    shell.onSearch();
    old.next([{ name: 'Maria', nickname: 'mariazinha' }]);
    expect(shell.searchResults()).toEqual([]);
    shell.closeSearch();
    vi.advanceTimersByTime(300);
    expect(api.searchProfiles).toHaveBeenCalledTimes(1);
    expect(shell.isSearching()).toBe(false);
  });
});
