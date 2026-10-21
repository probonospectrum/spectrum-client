import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';
import { SocialShell } from './social-shell';
import { UserService } from '../../../core/services/user/user.service';
import { NotificationService } from '../../../core/services/notifications/notification.service';
import { PublicAgencyService } from '../../../core/services/user/public-agency.service';
import { LoggedUser } from '../../../core/services/user/user.service';

describe('SocialShell profile search', () => {
  let api: { searchProfiles: ReturnType<typeof vi.fn> };
  let assigned: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    vi.useFakeTimers();
    assigned = vi.fn().mockReturnValue(of([]));
    api = { searchProfiles: vi.fn().mockReturnValue(of([{ name: 'Maria', nickname: 'mariazinha', avatarUrl: 'https://example.test/maria.png' }])) };
    TestBed.configureTestingModule({ providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: {} },
      { provide: UserService, useValue: { ...api, currentUser: () => null } },
      { provide: NotificationService, useValue: { notifications: () => [] } },
      { provide: PublicAgencyService, useValue: { assigned } },
    ] });
  });
  afterEach(() => vi.useRealTimers());

  it('counts assigned occurrences only for an approved public agency', () => {
    const shell = TestBed.runInInjectionContext(() => new SocialShell());
    const changes = { user: {} as import('@angular/core').SimpleChange };
    shell.user = { accountType: 'CITIZEN', occurrenceRole: 'USER' } as LoggedUser;
    shell.ngOnChanges(changes);
    expect(assigned).not.toHaveBeenCalled();
    shell.user = { accountType: 'PUBLIC_AGENCY', occurrenceRole: 'USER' } as LoggedUser;
    shell.ngOnChanges(changes);
    expect(assigned).not.toHaveBeenCalled();
    assigned.mockReturnValue(of([{ _id: 'one' }, { _id: 'two' }]));
    shell.user = { accountType: 'PUBLIC_AGENCY', occurrenceRole: 'RESPONSIBLE_AGENCY' } as LoggedUser;
    shell.ngOnChanges(changes);
    expect(shell.assignedOccurrenceCount()).toBe(2);
  });

  it('clears the counter and ignores a previous account response after switching accounts', () => {
    const response = new Subject<{ _id: string; title: string; status: string }[]>();
    assigned.mockReturnValue(response);
    const shell = TestBed.runInInjectionContext(() => new SocialShell());
    const changes = { user: {} as import('@angular/core').SimpleChange };
    shell.user = { accountType: 'PUBLIC_AGENCY', occurrenceRole: 'RESPONSIBLE_AGENCY' } as LoggedUser;
    shell.ngOnChanges(changes);
    response.next([{ _id: 'one', title: 'Post', status: 'ENCAMINHADA' }]);
    expect(shell.assignedOccurrenceCount()).toBe(1);
    shell.user = null;
    shell.ngOnChanges(changes);
    response.next([{ _id: 'one', title: 'Post', status: 'ENCAMINHADA' }]);
    expect(shell.assignedOccurrenceCount()).toBe(0);
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
