import { Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountMockService, SettingsData } from '../../../core/services/account/account-mock.service';
import { PostService } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { ThemeService } from '../../../core/services/theme/theme.service';
import { SettingsDialog } from '../../../shared/components/settings-dialog/settings-dialog';
import { SettingsSection } from '../../../shared/components/settings-section/settings-section';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';
import { ToggleSwitch } from '../../../shared/components/toggle-switch/toggle-switch';

type SettingsDialogKind =
  | 'name'
  | 'username'
  | 'email'
  | 'password'
  | 'sessions'
  | 'twoFactorEnable'
  | 'twoFactorDisable'
  | null;

interface DemoSession {
  id: string;
  title: string;
  device: string;
  browser: string;
  location: string;
  lastSeen: string;
  current: boolean;
}

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, SocialShell, SettingsSection, ToggleSwitch, SettingsDialog],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage implements OnDestroy {
  @ViewChild('twoFactorCodeInput') private twoFactorCodeInput?: ElementRef<HTMLInputElement>;
  @ViewChild('twoFactorDoneButton') private twoFactorDoneButton?: ElementRef<HTMLButtonElement>;
  private readonly accountService = inject(AccountMockService);
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private usernameTimer?: ReturnType<typeof setTimeout>;
  private passwordTimer?: ReturnType<typeof setTimeout>;
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly user = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;
  settings: SettingsData = {
    ...this.accountService.getSettings(),
    darkTheme: this.themeService.darkMode(),
  };
  demoAccount = {
    name: 'Samyra Fernandes',
    username: 'samyrafernandes19',
    email: 'samyrafernandes19@gmail.com',
    pendingEmail: '',
  };
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  nameDraft = '';
  usernameDraft = '';
  emailDraft = '';
  twoFactorCode = '';
  activeDialog: SettingsDialogKind = null;
  formError = '';
  usernameStatus: 'idle' | 'checking' | 'available' = 'idle';
  passwordSaving = false;
  twoFactorStep = 1;
  toastMessage = '';
  sessions: DemoSession[] = [
    {
      id: 'current-windows',
      title: 'Sessão atual',
      device: 'Windows',
      browser: 'Chrome',
      location: 'São Paulo, SP',
      lastSeen: 'Ativa agora',
      current: true,
    },
    {
      id: 'android-mobile',
      title: 'Outra sessão',
      device: 'Android',
      browser: 'Chrome Mobile',
      location: 'São Paulo, SP',
      lastSeen: 'Há 2 horas',
      current: false,
    },
  ];

  ngOnDestroy(): void {
    this.clearUsernameTimer();
    this.clearPasswordTimer();
    this.clearToastTimer();
  }

  setSetting<K extends keyof SettingsData>(key: K, value: SettingsData[K]): void {
    this.settings = { ...this.settings, [key]: value };
    this.accountService.saveSettings(this.settings);

    if (key === 'darkTheme') {
      this.themeService.setDarkMode(Boolean(value));
    }

    this.showToast(this.feedbackForSetting(key, value));
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }

  openDialog(kind: Exclude<SettingsDialogKind, null>): void {
    this.activeDialog = kind;
    this.formError = '';
    this.passwordSaving = false;

    if (kind === 'name') {
      this.nameDraft = this.demoAccount.name;
    }

    if (kind === 'username') {
      this.usernameDraft = `@${this.demoAccount.username}`;
      this.usernameStatus = 'available';
    }

    if (kind === 'email') {
      this.emailDraft = '';
    }

    if (kind === 'password') {
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    }

    if (kind === 'twoFactorEnable') {
      this.twoFactorStep = 1;
      this.twoFactorCode = '';
    }
  }

  closeDialog(): void {
    this.activeDialog = null;
    this.formError = '';
    this.passwordSaving = false;
    this.clearUsernameTimer();
    this.clearPasswordTimer();
  }

  saveName(): void {
    const name = this.nameDraft.trim();

    if (!name) {
      this.formError = 'Informe um nome para continuar.';
      return;
    }

    this.demoAccount = { ...this.demoAccount, name };
    this.closeDialog();
    this.showToast('Nome atualizado com sucesso.');
  }

  onUsernameInput(): void {
    this.formError = '';
    this.clearUsernameTimer();

    if (this.getUsernameError()) {
      this.usernameStatus = 'idle';
      return;
    }

    const checkedValue = this.usernameDraft;
    this.usernameStatus = 'checking';
    this.usernameTimer = setTimeout(() => {
      if (this.usernameDraft === checkedValue) {
        this.usernameStatus = 'available';
      }
    }, 450);
  }

  saveUsername(): void {
    const error = this.getUsernameError();

    if (error) {
      this.formError = error;
      return;
    }

    if (this.usernameStatus === 'checking') {
      this.formError = 'Aguarde a verificação de disponibilidade.';
      return;
    }

    this.demoAccount = {
      ...this.demoAccount,
      username: this.normalizeUsername(this.usernameDraft),
    };
    this.closeDialog();
    this.showToast('Username atualizado.');
  }

  saveEmail(): void {
    const email = this.emailDraft.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.formError = 'Informe um e-mail válido.';
      return;
    }

    this.demoAccount = { ...this.demoAccount, pendingEmail: email };
    this.closeDialog();
    this.showToast('E-mail de confirmação enviado.');
  }

  savePassword(): void {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.formError = 'Preencha todos os campos.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.formError = 'A nova senha precisa ter pelo menos 8 caracteres.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.formError = 'A confirmação precisa coincidir com a nova senha.';
      return;
    }

    this.passwordSaving = true;
    this.passwordTimer = setTimeout(() => {
      this.passwordTimer = undefined;
      this.closeDialog();
      this.showToast('Senha alterada com sucesso.');
    }, 500);
  }

  endSession(id: string): void {
    this.sessions = this.sessions.filter((session) => session.id !== id);
    this.saveSessionCount();
    this.showToast('Sessão encerrada.');
  }

  endOtherSessions(): void {
    this.sessions = this.sessions.filter((session) => session.current);
    this.saveSessionCount();
    this.showToast('Todas as outras sessões foram encerradas.');
  }

  handleTwoFactorToggle(enabled: boolean): void {
    if (enabled) {
      this.openDialog('twoFactorEnable');
      return;
    }

    if (this.settings.twoFactorAuth) {
      this.openDialog('twoFactorDisable');
    }
  }

  startTwoFactorVerification(): void {
    this.twoFactorStep = 2;
    this.twoFactorCode = '';
    this.formError = '';
    setTimeout(() => this.twoFactorCodeInput?.nativeElement.focus());
  }

  confirmTwoFactorCode(): void {
    if (!/^\d{6}$/.test(this.twoFactorCode)) {
      this.formError = 'Informe um código de 6 dígitos.';
      return;
    }

    if (this.twoFactorCode !== '123456') {
      this.formError = 'Código inválido para esta demonstração.';
      return;
    }

    this.updateSettingWithoutToast('twoFactorAuth', true);
    this.twoFactorStep = 3;
    this.formError = '';
    this.showToast('Autenticação de dois fatores ativada.');
    setTimeout(() => this.twoFactorDoneButton?.nativeElement.focus());
  }

  disableTwoFactor(): void {
    this.updateSettingWithoutToast('twoFactorAuth', false);
    this.closeDialog();
    this.showToast('Autenticação de dois fatores desativada.');
  }

  get usernameFeedback(): string {
    if (this.usernameStatus === 'checking') {
      return 'Verificando disponibilidade...';
    }

    if (this.usernameStatus === 'available' && !this.getUsernameError()) {
      return 'Username disponível';
    }

    return 'Use letras, números, ponto ou underline, sem espaços.';
  }

  get twoFactorToggleChecked(): boolean {
    if (this.activeDialog === 'twoFactorEnable') {
      return true;
    }

    if (this.activeDialog === 'twoFactorDisable') {
      return false;
    }

    return this.settings.twoFactorAuth;
  }

  get usernameFeedbackKind(): 'muted' | 'checking' | 'success' {
    if (this.usernameStatus === 'checking') {
      return 'checking';
    }

    if (this.usernameStatus === 'available' && !this.getUsernameError()) {
      return 'success';
    }

    return 'muted';
  }

  get emailSummary(): string {
    return this.demoAccount.pendingEmail
      ? `Pendente: ${this.demoAccount.pendingEmail}`
      : this.demoAccount.email;
  }

  get activeSessionSummary(): string {
    const device = this.sessions.find((session) => session.current)?.device ?? 'dispositivo';
    return `${this.sessions.length} ${this.sessions.length === 1 ? 'sessão' : 'sessões'} - ${device}`;
  }

  private getUsernameError(): string {
    const username = this.normalizeUsername(this.usernameDraft);

    if (!username) {
      return 'Informe um username.';
    }

    if (/\s/.test(this.usernameDraft)) {
      return 'O username não pode conter espaços.';
    }

    if (username.length < 3 || username.length > 24) {
      return 'O username precisa ter entre 3 e 24 caracteres.';
    }

    if (!/^[a-zA-Z0-9._]+$/.test(username)) {
      return 'Use apenas letras, números, ponto ou underline.';
    }

    return '';
  }

  private normalizeUsername(value: string): string {
    return value.trim().replace(/^@+/, '').toLowerCase();
  }

  private updateSettingWithoutToast<K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K],
  ): void {
    this.settings = { ...this.settings, [key]: value };
    this.accountService.saveSettings(this.settings);
  }

  private saveSessionCount(): void {
    this.updateSettingWithoutToast('activeSessions', this.sessions.length);
  }

  private feedbackForSetting<K extends keyof SettingsData>(key: K, value: SettingsData[K]): string {
    if (key === 'language') {
      return 'Idioma atualizado.';
    }

    if (key === 'privateAccount') {
      return value ? 'Conta privada ativada.' : 'Conta pública ativada.';
    }

    if (key === 'darkTheme') {
      return value ? 'Tema escuro ativo.' : 'Tema claro ativo.';
    }

    if (key === 'compactMode') {
      return value ? 'Modo compacto ativado.' : 'Modo compacto desativado.';
    }

    return 'Preferência atualizada.';
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    this.clearToastTimer();
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
    }, 2800);
  }

  private clearUsernameTimer(): void {
    if (this.usernameTimer) {
      clearTimeout(this.usernameTimer);
      this.usernameTimer = undefined;
    }
  }

  private clearToastTimer(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = undefined;
    }
  }

  private clearPasswordTimer(): void {
    if (this.passwordTimer) {
      clearTimeout(this.passwordTimer);
      this.passwordTimer = undefined;
    }
  }
}
