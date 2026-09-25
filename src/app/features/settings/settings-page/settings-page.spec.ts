import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SettingsPage } from './settings-page';

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

  function clickButton(text: string): void {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];
    const button = buttons.find((item) => item.textContent?.includes(text));
    expect(button).toBeTruthy();
    button?.click();
  }
});
