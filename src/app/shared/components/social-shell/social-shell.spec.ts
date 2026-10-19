import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { Subject, of } from 'rxjs';
import { SocialShell } from './social-shell';
import { UserService } from '../../../core/services/user/user.service';
import { NotificationService } from '../../../core/services/notifications/notification.service';

describe('SocialShell profile search', () => {
  let api: { searchProfiles: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    vi.useFakeTimers();
    api = { searchProfiles: vi.fn().mockReturnValue(of([{ name: 'Maria', nickname: 'mariazinha', avatarUrl: 'https://example.test/maria.png' }])) };
    TestBed.configureTestingModule({ providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: {} },
      { provide: UserService, useValue: api },
      { provide: NotificationService, useValue: {} },
    ] });
  });
  afterEach(() => vi.useRealTimers());

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
