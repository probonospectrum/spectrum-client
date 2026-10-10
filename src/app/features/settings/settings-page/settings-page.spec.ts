import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SettingsPage } from './settings-page';
import { I18nService } from '../../../core/i18n/i18n.service';
import { DEFAULT_SETTINGS } from '../../../core/services/account/settings.service';
import { API_BASE_URL } from '../../../core/constants/api-routes';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';

describe('SettingsPage', () => {
  let component: SettingsPage;
  let fixture: ComponentFixture<SettingsPage>;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    TestBed.inject(UserService).saveSession({ token: 'test', message: '', user: {
      _id: 'ana', name: 'Ana', nickname: 'ana', email: 'ana@example.com', birthDate: '2000-01-01',
    } });
    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(API_BASE_URL + '/user/me/settings').flush(DEFAULT_SETTINGS);
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
    TestBed.inject(HttpTestingController).verify();
  });

  it('saves Spanish through the existing dropdown and updates the interface without reloading preferences', async () => {
    const select = fixture.nativeElement.querySelector('select[name="language"]') as HTMLSelectElement;
    expect([...select.options].map(option => option.value)).toEqual(['pt-BR', 'en-US', 'es']);
    select.value = 'es';
    component.changeLanguage({ target: select } as unknown as Event);
    const request = TestBed.inject(HttpTestingController).expectOne(API_BASE_URL + '/user/me/settings');
    expect(request.request.body).toEqual({ language: 'es' });
    request.flush({ ...DEFAULT_SETTINGS, language: 'es' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(TestBed.inject(I18nService).language()).toBe('es');
    expect(fixture.nativeElement.textContent).toContain('Preferencias');
    expect(select.value).toBe('es');
    expect(localStorage.getItem('spectrum.language')).toBe('es');
    TestBed.inject(HttpTestingController).expectNone(API_BASE_URL + '/user/me/settings');
  });

  it('keeps the previous language when saving fails', async () => {
    const saving = component.setSetting('language', 'es');
    TestBed.inject(HttpTestingController).expectOne(API_BASE_URL + '/user/me/settings')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    await saving;
    expect(TestBed.inject(I18nService).language()).toBe('pt-BR');
    expect(component.settings.language).toBe('pt-BR');
  });

  it('opens real account controls and omits simulated security controls', () => {
    clickButton('Alterar nome');
    expect(component.activeDialog).toBe('name');
    component.closeDialog();
    clickButton('Username');
    expect(component.activeDialog).toBe('username');
    component.closeDialog();
    clickButton('Alterar senha');
    expect(component.activeDialog).toBe('password');
    expect(fixture.nativeElement.textContent).not.toContain('Sessões ativas');
    expect(fixture.nativeElement.textContent).not.toContain('dois fatores');
  });

  it('keeps cancelled changes and only confirms a name after the server saves it', async () => {
    component.openDialog('name');
    component.nameDraft = 'Temporario';
    component.closeDialog();
    expect(component.account.name).toBe('Ana');
    component.openDialog('name');
    component.nameDraft = 'Ana Silva';
    const saving = component.saveName();
    expect(component.account.name).toBe('Ana');
    const request = TestBed.inject(HttpTestingController).expectOne(API_BASE_URL + '/user/me/account');
    expect(request.request.body).toEqual({ name: 'Ana Silva' });
    request.flush({ ...TestBed.inject(UserService).getCurrentUser(), name: 'Ana Silva' });
    await saving;
    expect(component.account.name).toBe('Ana Silva');
    expect(TestBed.inject(UserService).getCurrentUser()?.name).toBe('Ana Silva');
  });

  it('validates usernames and reports conflicts returned by the server', async () => {
    component.openDialog('username');
    component.usernameDraft = '@ana silva';
    await component.saveUsername();
    expect(component.formError).toContain('não pode conter espaços');
    component.usernameDraft = '@ana.silva';
    const saving = component.saveUsername();
    TestBed.inject(HttpTestingController).expectOne(API_BASE_URL + '/user/me/account')
      .flush({}, { status: 400, statusText: 'Username in use' });
    await saving;
    expect(component.account.username).toBe('ana');
    expect(component.formError).toContain('em uso');
    expect(component.activeDialog).toBe('username');
  });

  it('saves preferences to the authenticated account and retains other preferences', async () => {
    const saving = component.setSetting('privateAccount', true);
    expect(component.settings.privateAccount).toBe(false);
    const request = TestBed.inject(HttpTestingController).expectOne(API_BASE_URL + '/user/me/settings');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ privateAccount: true });
    request.flush({ ...DEFAULT_SETTINGS, privateAccount: true, compactMode: true });
    await saving;
    expect(component.settings.privateAccount).toBe(true);
    expect(component.settings.compactMode).toBe(true);
    expect(component.toastMessage).toContain('privada');
  });

  it('keeps the last saved preference and allows retry after a server failure', async () => {
    const saving = component.setSetting('news', true);
    TestBed.inject(HttpTestingController).expectOne(API_BASE_URL + '/user/me/settings')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    await saving;
    expect(component.settings.news).toBe(false);
    expect(component.settingsError()).toBeTruthy();
    expect(component.settingsSaving()).toBe(false);
    expect(component.toastMessage).toBe('');
  });

  it('keeps the checkbox at its persisted value when the server rejects a change', async () => {
    const input = fixture.nativeElement.querySelector('app-toggle-switch input') as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(input.checked).toBe(false);
    TestBed.inject(HttpTestingController).expectOne(API_BASE_URL + '/user/me/settings')
      .flush({}, { status: 503, statusText: 'Unavailable' });
    await Promise.resolve();
    fixture.detectChanges();
    expect(input.checked).toBe(false);
    expect(component.settings.darkTheme).toBe(false);
  });

  it('sends current and new passwords and only confirms a successful server response', async () => {
    component.openDialog('password');
    component.currentPassword = 'current-password';
    component.newPassword = component.confirmPassword = 'new-password-2026';
    const saving = component.savePassword();
    const request = TestBed.inject(HttpTestingController).expectOne(API_BASE_URL + '/user/me/password');
    expect(request.request.body).toEqual({ currentPassword: 'current-password', newPassword: 'new-password-2026' });
    request.flush({ message: 'ok' });
    await saving;
    expect(component.activeDialog).toBeNull();
    expect(component.toastMessage).toContain('Senha alterada');
  });

  it('should discard the photo draft when cancelling', () => {
    clickButton('Foto de perfil');
    expect(component.activeDialog).toBe('avatar');
    component.avatarDraft.set('data:image/png;base64,draft');
    component.closeDialog();
    expect(component.avatarDraft()).toBe('');
    expect(component.avatarUrl).toBe('');
    expect(TestBed.inject(UserService).getCurrentUser()?._id).toBe('ana');
  });

  it('should reject unsupported and oversized photos', () => {
    component.openDialog('avatar');
    const select = (file: File) => component.selectAvatar({
      target: { files: [file], value: '' },
    } as unknown as Event);

    select(new File(['text'], 'photo.txt', { type: 'text/plain' }));
    expect(component.formError).toContain('JPG, PNG ou WebP');
    select(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'photo.png', { type: 'image/png' }));
    expect(component.formError).toContain('2 MB');
    expect(component.avatarDraft()).toBe('');
  });

  it('should drag the image within the crop bounds and keep it covering the frame when zooming out', () => {
    component.avatarReady.set(true);
    component.avatarWidth = 2;
    component.avatarHeight = 1;
    const target = {
      focus: vi.fn(),
      setPointerCapture: vi.fn(),
      hasPointerCapture: () => true,
      releasePointerCapture: vi.fn(),
      getBoundingClientRect: () => ({ width: 320 }),
    };
    const pointer = (x: number, y: number) => ({
      pointerId: 1, button: 0, currentTarget: target,
      clientX: x, clientY: y, preventDefault: vi.fn(),
    }) as unknown as PointerEvent;

    component.startAvatarDrag(pointer(0, 0));
    component.moveAvatarDrag(pointer(80, 80));
    expect(component.avatarOffsetX).toBe(0.25);
    expect(component.avatarOffsetY).toBe(0);
    component.moveAvatarDrag(pointer(2000, 2000));
    expect(component.avatarOffsetX).toBe(0.5);
    component.endAvatarDrag(pointer(2000, 2000));
    expect(target.releasePointerCapture).toHaveBeenCalledWith(1);

    component.zoomAvatar(1);
    component.moveAvatarWithKeyboard(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.avatarOffsetY).toBe(0.02);
    component.zoomAvatar(-1);
    expect(component.avatarOffsetY).toBe(0);
    component.closeDialog();
    expect(component.avatarZoom).toBe(1);
    expect(component.avatarOffsetX).toBe(0);
  });

  it('should upload the same crop, prevent duplicates and update the sidebar after success', async () => {
    const user = { _id: 'ana', name: 'Ana Martins' } as LoggedUser;
    TestBed.inject(UserService).saveSession({ user, token: 'test', message: '' });
    fixture.destroy();
    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    component.openDialog('avatar');
    component.avatarDraft.set('data:image/png;base64,photo');
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector('.settings-avatar-crop img');
    Object.defineProperties(image, {
      naturalWidth: { value: 1200 }, naturalHeight: { value: 800 },
    });
    component.onAvatarLoaded();
    component.zoomAvatar(1);
    component.avatarOffsetX = 0.25;
    component.avatarOffsetY = -0.25;
    const drawImage = vi.fn();
    const contextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
    const exportSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback) => callback(new Blob(['cropped'], { type: 'image/png' })));
    try {
      const saving = component.saveAvatar();
      await component.saveAvatar();
      component.closeDialog();
      expect(component.activeDialog).toBe('avatar');
      expect(component.avatarSaving()).toBe(true);
      await Promise.resolve();
      expect(drawImage).toHaveBeenCalledWith(image, 300, 300, 400, 400, 0, 0, 512, 512);
      const request = TestBed.inject(HttpTestingController).expectOne(API_BASE_URL + '/user/ana/avatar');
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body.get('avatar').type).toBe('image/png');
      request.flush({ message: 'ok', avatarUrl: 'https://example.com/new.png' });
      await saving;
      fixture.detectChanges();
      expect(component.avatarSaving()).toBe(false);
      expect(component.activeDialog).toBeNull();
      expect(component.avatarUrl).toBe('https://example.com/new.png');
      expect(fixture.nativeElement.querySelector('.social-avatar img').getAttribute('src')).toBe(component.avatarUrl);
    } finally {
      contextSpy.mockRestore();
      exportSpy.mockRestore();
    }
  });

  it('keeps the crop and session after a failed upload and allows retry', async () => {
    const service = TestBed.inject(UserService);
    const session = { user: { _id: 'ana', avatarUrl: 'https://example.com/old.png' } as LoggedUser, token: 'test', message: '' };
    service.saveSession(session);
    component.openDialog('avatar');
    component.avatarDraft.set('data:image/png;base64,photo');
    fixture.detectChanges();
    const image = fixture.nativeElement.querySelector('.settings-avatar-crop img');
    Object.defineProperties(image, { naturalWidth: { value: 800 }, naturalHeight: { value: 800 } });
    component.onAvatarLoaded();
    component.zoomAvatar(1);
    component.avatarOffsetX = 0.1;
    const context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    const exportImage = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(callback => callback(new Blob(['image'], { type: 'image/png' })));
    try {
      const saving = component.saveAvatar();
      await Promise.resolve();
      TestBed.inject(HttpTestingController).expectOne(API_BASE_URL + '/user/ana/avatar').flush({}, { status: 500, statusText: 'Error' });
      await saving;
      expect(component.activeDialog).toBe('avatar');
      expect(component.avatarDraft()).toBe('data:image/png;base64,photo');
      expect(component.avatarZoom).toBe(2);
      expect(component.avatarOffsetX).toBe(0.1);
      expect(component.avatarSaving()).toBe(false);
      expect(component.formError).toBeTruthy();
      expect(service.getCurrentUser()).toEqual(session.user);
      const retry = component.saveAvatar();
      await Promise.resolve();
      TestBed.inject(HttpTestingController).expectOne(API_BASE_URL + '/user/ana/avatar').flush({ message: 'ok', avatarUrl: 'https://example.com/new.png' });
      await retry;
      expect(component.activeDialog).toBeNull();
    } finally { context.mockRestore(); exportImage.mockRestore(); }
  });

  it('removes the profile photo and shows the initial throughout the page', async () => {
    const service = TestBed.inject(UserService);
    service.saveSession({ token: 'token', message: '', user: {
      _id: 'ana', name: 'Ana', avatarUrl: 'https://example.com/ana.png',
    } as LoggedUser });
    component.openDialog('avatar');
    fixture.detectChanges();
    const button = [...fixture.nativeElement.querySelectorAll('button')].find(
      (item: any) => item.textContent.includes('Remover foto de perfil'),
    ) as HTMLButtonElement;
    expect(button.querySelector('.material-symbols-outlined')?.textContent).toBe('delete');
    const removing = component.removeAvatar();
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    TestBed.inject(HttpTestingController).expectOne(API_BASE_URL + '/user/ana/avatar')
      .flush({ message: 'ok', avatarUrl: '' });
    await removing;
    fixture.detectChanges();
    expect(component.activeDialog).toBeNull();
    expect(component.avatarUrl).toBe('');
    expect(fixture.nativeElement.querySelector('.social-avatar img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.settings-row__avatar').textContent.trim()).toBe('A');
  });

  function clickButton(text: string): void {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const button = buttons.find((item) => item.textContent?.includes(text));
    expect(button).toBeTruthy();
    button?.click();
  }
});
