import { firstValueFrom } from 'rxjs';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';
import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
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
  | 'avatar'
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
  imports: [UserAvatar, FormsModule, SocialShell, SettingsSection, ToggleSwitch, SettingsDialog],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage implements OnDestroy {
  @ViewChild('avatarImage') private avatarImage?: ElementRef<HTMLImageElement>;
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

  get user() { return this.userService.currentUser(); }
  get avatarUrl(): string {
    return this.accountService.getAvatarUrl(this.user);
  }
  readonly avatarSaving = signal(false);
  private destroyed = false;
  avatarOffsetX = 0;
  avatarOffsetY = 0;
  avatarZoom = 1;
  avatarWidth = 1;
  avatarHeight = 1;
  private avatarDrag?: { id: number; x: number; y: number };
  readonly avatarDraft = signal('');
  readonly avatarReading = signal(false);
  readonly avatarReady = signal(false);
  private avatarReader?: FileReader;
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
    this.destroyed = true;
    this.clearAvatarDraft();
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
    this.clearAvatarDraft();
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
    if (this.avatarSaving()) return;
    this.clearAvatarDraft();
    this.activeDialog = null;
    this.formError = '';
    this.passwordSaving = false;
    this.clearUsernameTimer();
    this.clearPasswordTimer();
  }

  selectAvatar(event: Event): void {
    if (this.avatarSaving()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.clearAvatarDraft();
    this.formError = '';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.formError = 'Selecione uma imagem JPG, PNG ou WebP.';
      return;
    }
    if (!file.size || file.size > 2 * 1024 * 1024) {
      this.formError = 'Selecione uma imagem de até 2 MB que não esteja vazia.';
      return;
    }

    const reader = new FileReader();
    this.avatarReader = reader;
    this.avatarReading.set(true);
    reader.onload = () => {
      this.avatarDraft.set(typeof reader.result === 'string' ? reader.result : '');
      this.avatarReading.set(false);
    };
    reader.onerror = () => {
      this.formError = 'Não foi possível ler a imagem. Selecione outro arquivo.';
      this.avatarReading.set(false);
    };
    reader.readAsDataURL(file);
  }

  onAvatarPreviewError(): void {
    this.avatarReady.set(false);
    this.avatarDraft.set('');
    this.formError = 'Não foi possível abrir a imagem. Selecione outro arquivo.';
  }

  onAvatarLoaded(): void {
    const image = this.avatarImage?.nativeElement;
    if (!image?.naturalWidth || !image.naturalHeight) return;
    const size = Math.min(image.naturalWidth, image.naturalHeight);
    this.avatarWidth = image.naturalWidth / size;
    this.avatarHeight = image.naturalHeight / size;
    this.avatarReady.set(true);
  }

  startAvatarDrag(event: PointerEvent): void {
    if (this.avatarSaving() || !this.avatarReady() || event.button !== 0 || this.avatarDrag) return;
    const target = event.currentTarget as HTMLElement;
    target.focus();
    target.setPointerCapture(event.pointerId);
    this.avatarDrag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    event.preventDefault();
  }

  moveAvatarDrag(event: PointerEvent): void {
    if (this.avatarSaving()) return;
    const drag = this.avatarDrag;
    if (!drag || drag.id !== event.pointerId) return;
    const width = (event.currentTarget as HTMLElement).getBoundingClientRect().width;
    if (!width) return;
    this.avatarOffsetX += (event.clientX - drag.x) / width;
    this.avatarOffsetY += (event.clientY - drag.y) / width;
    this.avatarDrag = { id: drag.id, x: event.clientX, y: event.clientY };
    this.clampAvatarOffset();
  }

  endAvatarDrag(event: PointerEvent): void {
    if (this.avatarDrag?.id !== event.pointerId) return;
    this.avatarDrag = undefined;
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
  }

  moveAvatarWithKeyboard(event: KeyboardEvent): void {
    if (this.avatarSaving()) return;
    const step = event.shiftKey ? 0.1 : 0.02;
    switch (event.key) {
      case 'ArrowLeft': this.avatarOffsetX -= step; break;
      case 'ArrowRight': this.avatarOffsetX += step; break;
      case 'ArrowUp': this.avatarOffsetY -= step; break;
      case 'ArrowDown': this.avatarOffsetY += step; break;
      default: return;
    }
    event.preventDefault();
    this.clampAvatarOffset();
  }

  zoomAvatar(amount: number): void {
    if (this.avatarSaving()) return;
    this.avatarZoom = Math.min(3, Math.max(1, Math.round((this.avatarZoom + amount) * 10) / 10));
    this.clampAvatarOffset();
  }

  private clampAvatarOffset(): void {
    const maxX = (this.avatarWidth * this.avatarZoom - 1) / 2;
    const maxY = (this.avatarHeight * this.avatarZoom - 1) / 2;
    this.avatarOffsetX = Math.max(-maxX, Math.min(maxX, this.avatarOffsetX));
    this.avatarOffsetY = Math.max(-maxY, Math.min(maxY, this.avatarOffsetY));
  }

  async removeAvatar(): Promise<void> {
    if (this.avatarSaving() || !this.avatarUrl) return;
    this.avatarSaving.set(true);
    this.formError = '';
    try {
      await firstValueFrom(this.userService.removeAvatar());
      if (this.destroyed) return;
      this.avatarSaving.set(false);
      this.closeDialog();
      this.showToast('Foto de perfil removida.');
    } catch {
      if (!this.destroyed) this.formError = 'Não foi possível remover a foto. Tente novamente.';
    } finally {
      this.avatarSaving.set(false);
    }
  }

  async saveAvatar(): Promise<void> {
    if (this.avatarSaving() || !this.avatarDraft() || this.avatarReading() || !this.avatarReady()) return;
    const userId = this.user?._id;
    if (!userId) {
      this.formError = 'Entre na sua conta para salvar a foto.';
      return;
    }
    const image = this.avatarImage?.nativeElement;
    if (!image?.naturalWidth || !image.naturalHeight) return;

    this.avatarSaving.set(true);
    this.formError = '';
    try {
      const size = Math.min(image.naturalWidth, image.naturalHeight) / this.avatarZoom;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 512;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Não foi possível preparar a foto.');
      context.drawImage(image,
        (image.naturalWidth - size) / 2 - this.avatarOffsetX * size,
        (image.naturalHeight - size) / 2 - this.avatarOffsetY * size,
        size, size, 0, 0, 512, 512);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result
          ? resolve(result)
          : reject(new Error('Não foi possível preparar a foto.')), 'image/png');
      });
      if (this.destroyed) return;
      if (this.user?._id !== userId) throw new Error('A sessão foi alterada. Entre novamente.');
      await firstValueFrom(this.userService.uploadAvatar(blob));
      if (this.destroyed) return;
      this.avatarSaving.set(false);
      this.closeDialog();
      this.showToast('Foto de perfil atualizada.');
    } catch {
      if (!this.destroyed) this.formError = 'Não foi possível salvar a foto. Tente novamente.';
    } finally {
      this.avatarSaving.set(false);
    }
  }

  private clearAvatarDraft(): void {
    if (this.avatarReader) {
      this.avatarReader.onload = null;
      this.avatarReader.onerror = null;
      if (this.avatarReader.readyState === FileReader.LOADING) this.avatarReader.abort();
      this.avatarReader = undefined;
    }
    this.avatarDraft.set('');
    this.avatarReading.set(false);
    this.avatarReady.set(false);
    this.avatarOffsetX = 0;
    this.avatarOffsetY = 0;
    this.avatarZoom = 1;
    this.avatarWidth = 1;
    this.avatarHeight = 1;
    this.avatarDrag = undefined;
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
