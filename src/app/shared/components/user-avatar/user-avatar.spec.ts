import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';
import { UserAvatar } from './user-avatar';

describe('UserAvatar', () => {
  const user = { _id: 'ana', name: 'Ana Martins', avatarUrl: '' } as LoggedUser;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [UserAvatar], providers: [provideHttpClient()] });
  });

  it('updates mounted avatars from the session even with old user inputs and legacy local photos', async () => {
    const service = TestBed.inject(UserService);
    service.saveSession({ user, token: 'test', message: '' });
    localStorage.setItem('spectrum-mock-avatar-ana', 'data:image/png;base64,old');
    const fixtures = [TestBed.createComponent(UserAvatar), TestBed.createComponent(UserAvatar)];
    for (const fixture of fixtures) {
      fixture.componentRef.setInput('user', user);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('img')).toBeNull();
    }
    service.saveSession({ user: { ...user, avatarUrl: 'https://example.com/new.png' }, token: 'test', message: '' });
    for (const fixture of fixtures) {
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('https://example.com/new.png');
    }
  });

  it('uses the initial for placeholders and failed images', async () => {
    const fixture = TestBed.createComponent(UserAvatar);
    fixture.componentRef.setInput('user', { ...user, avatarUrl: 'https://placehold.co/200x200.png' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('A');
    fixture.componentRef.setInput('user', { ...user, avatarUrl: 'https://example.com/broken.png' });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('does not show the current user photo for a different or absent user', () => {
    TestBed.inject(UserService).saveSession({ user: { ...user, avatarUrl: 'https://example.com/mine.png' }, token: 'test', message: '' });
    const fixture = TestBed.createComponent(UserAvatar);
    fixture.componentRef.setInput('user', { ...user, _id: 'other', avatarUrl: 'https://example.com/other.png' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe('https://example.com/other.png');
    fixture.componentRef.setInput('user', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });
});
