import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SettingsPage } from './settings-page';
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

    fixture = TestBed.createComponent(SettingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
    TestBed.inject(HttpTestingController).verify();
  });

  it('should open the correct dialog when clicking account and security rows', () => {
    clickButton('Alterar nome');
    expect(component.activeDialog).toBe('name');

    component.closeDialog();
    clickButton('Username');
    expect(component.activeDialog).toBe('username');

    component.closeDialog();
    clickButton('E-mail principal');
    expect(component.activeDialog).toBe('email');

    component.closeDialog();
    clickButton('Alterar senha');
    expect(component.activeDialog).toBe('password');

    component.closeDialog();
    clickButton('Sessões ativas');
    expect(component.activeDialog).toBe('sessions');
  });

  it('should cancel without saving and save mock account changes locally', () => {
    component.openDialog('name');
    component.nameDraft = 'Nome Temporário';
    component.closeDialog();
    expect(component.demoAccount.name).toBe('Samyra Fernandes');

    component.openDialog('name');
    component.nameDraft = 'Samire Fernandes';
    component.saveName();

    expect(component.demoAccount.name).toBe('Samire Fernandes');
    expect(component.activeDialog).toBeNull();
  });

  it('should validate and save mock username changes', () => {
    component.openDialog('username');
    component.usernameDraft = '@samire fernandes';
    component.saveUsername();
    expect(component.formError).toContain('não pode conter espaços');

    component.usernameDraft = '@samire.fernandes';
    component.onUsernameInput();
    component.usernameStatus = 'available';
    component.saveUsername();

    expect(component.demoAccount.username).toBe('samire.fernandes');
  });

  it('should keep email changes pending and remove mock sessions visually', () => {
    component.openDialog('email');
    component.emailDraft = 'novo.email@example.com';
    component.saveEmail();
    expect(component.demoAccount.pendingEmail).toBe('novo.email@example.com');

    component.endSession('android-mobile');
    expect(component.sessions.map((session) => session.id)).toEqual(['current-windows']);
  });

  it('should toggle mock preferences and complete two factor demo flow', () => {
    component.setSetting('privateAccount', true);
    component.setSetting('compactMode', true);
    expect(component.settings.privateAccount).toBe(true);
    expect(component.settings.compactMode).toBe(true);

    component.handleTwoFactorToggle(true);
    expect(component.activeDialog).toBe('twoFactorEnable');

    component.startTwoFactorVerification();
    component.twoFactorCode = '123456';
    component.confirmTwoFactorCode();

    expect(component.settings.twoFactorAuth).toBe(true);
    expect(component.twoFactorStep).toBe(3);

    component.handleTwoFactorToggle(false);
    component.disableTwoFactor();
    expect(component.settings.twoFactorAuth).toBe(false);
  });

  it('should not send HTTP requests for settings actions', () => {
    component.openDialog('name');
    component.nameDraft = 'Samire Fernandes';
    component.saveName();
    component.setSetting('language', 'en-US');
    component.endOtherSessions();
    component.handleTwoFactorToggle(true);
    component.startTwoFactorVerification();
    component.twoFactorCode = '123456';
    component.confirmTwoFactorCode();

    TestBed.inject(HttpTestingController).expectNone(() => true);
  });

  it('should discard the photo draft when cancelling', () => {
    clickButton('Foto de perfil');
    expect(component.activeDialog).toBe('avatar');
    component.avatarDraft.set('data:image/png;base64,draft');
    component.closeDialog();
    expect(component.avatarDraft()).toBe('');
    expect(component.avatarUrl).toBe('');
    expect(localStorage.length).toBe(0);
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

  function clickButton(text: string): void {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const button = buttons.find((item) => item.textContent?.includes(text));
    expect(button).toBeTruthy();
    button?.click();
  }
});
