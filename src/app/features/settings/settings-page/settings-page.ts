import { firstValueFrom } from 'rxjs';
import { UserAvatar } from '../../../shared/components/user-avatar/user-avatar';
import { Component, ElementRef, OnDestroy, ViewChild, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountMockService } from '../../../core/services/account/account-mock.service';
import { DEFAULT_SETTINGS, SettingsService, UserSettings } from '../../../core/services/account/settings.service';
import { PostService } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { SettingsDialog } from '../../../shared/components/settings-dialog/settings-dialog';
import { SettingsSection } from '../../../shared/components/settings-section/settings-section';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';
import { ToggleSwitch } from '../../../shared/components/toggle-switch/toggle-switch';

type SettingsDialogKind =
  | 'avatar'
  | 'name'
  | 'username'
  | 'password'
  | null;

@Component({
  selector: 'app-settings-page',
  imports: [UserAvatar, FormsModule, SocialShell, SettingsSection, ToggleSwitch, SettingsDialog],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage implements OnDestroy {
  @ViewChild('avatarImage') private avatarImage?: ElementRef<HTMLImageElement>;
  private readonly accountService = inject(AccountMockService);
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  readonly preferencesService = inject(SettingsService);
  readonly settingsSaving = signal(false);
  readonly settingsError = signal('');
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
  settings: UserSettings = {
    ...DEFAULT_SETTINGS,
  };
  account = {
    name: this.user?.name ?? '',
    username: this.user?.nickname ?? '',
    email: this.user?.email ?? '',
  };
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  nameDraft = '';
  usernameDraft = '';
  activeDialog: SettingsDialogKind = null;
  formError = '';
  usernameStatus: 'idle' | 'checking' | 'available' = 'idle';
  passwordSaving = false;
  toastMessage = '';

  constructor() {
    effect(() => { this.settings = { ...this.settings, ...this.preferencesService.preferences() }; });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.clearAvatarDraft();
    this.clearUsernameTimer();
    this.clearPasswordTimer();
    this.clearToastTimer();
  }

  async setSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): Promise<void> {
    if (this.settingsSaving() || this.preferencesService.loading()) return;
    this.settingsSaving.set(true);
    this.settingsError.set('');
    const accountId = this.user?._id;
    try {
      const settings = await firstValueFrom(this.preferencesService.save({ [key]: value }));
      if (!this.destroyed && this.user?._id === accountId) { this.settings = { ...this.settings, ...settings }; this.showToast(this.feedbackForSetting(key, value)); }
    } catch {
      if (!this.destroyed) this.settingsError.set('Não foi possível salvar a preferência. Tente novamente.');
    } finally { this.settingsSaving.set(false); }
  }

  changeLanguage(event: Event): void {
    const input = event.target as HTMLSelectElement;
    const value = input.value;
    input.value = this.settings.language;
    void this.setSetting('language', value);
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
      this.nameDraft = this.account.name;
    }

    if (kind === 'username') {
      this.usernameDraft = `@${this.account.username}`;
      this.usernameStatus = 'idle';
    }


    if (kind === 'password') {
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
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

  async saveName(): Promise<void> {
    const name = this.nameDraft.trim();

    if (!name) {
      this.formError = 'Informe um nome para continuar.';
      return;
    }

    try {
      await firstValueFrom(this.userService.updateAccount({ name }));
      if (this.destroyed) return;
      this.account = { ...this.account, name };
      this.closeDialog();
      this.showToast('Nome atualizado com sucesso.');
    } catch { this.formError = 'Não foi possível atualizar o nome.'; }
  }

  onUsernameInput(): void {
    this.formError = '';
    this.clearUsernameTimer();

    if (this.getUsernameError()) {
      this.usernameStatus = 'idle';
      return;
    }

    this.usernameStatus = 'idle';
  }

  async saveUsername(): Promise<void> {
    const error = this.getUsernameError();

    if (error) {
      this.formError = error;
      return;
    }

    if (this.usernameStatus === 'checking') {
      this.formError = 'Aguarde a verificação de disponibilidade.';
      return;
    }

    try {
      const user = await firstValueFrom(this.userService.updateAccount({ nickname: this.normalizeUsername(this.usernameDraft) }));
      if (this.destroyed) return;
      this.account = { ...this.account, username: user.nickname };
      this.closeDialog();
      this.showToast('Username atualizado.');
    } catch { this.formError = 'Não foi possível atualizar. Verifique se o username já está em uso.'; }
  }

  async savePassword(): Promise<void> {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.formError = 'Preencha todos os campos.';
      return;
    }

    if (this.newPassword.length < 10) {
      this.formError = 'A nova senha precisa ter pelo menos 10 caracteres.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.formError = 'A confirmação precisa coincidir com a nova senha.';
      return;
    }

    this.passwordSaving = true;
    try {
      await firstValueFrom(this.userService.changePassword(this.currentPassword, this.newPassword));
      if (this.destroyed) return;
      this.closeDialog();
      this.showToast('Senha alterada com sucesso.');
    } catch { this.formError = 'Não foi possível alterar a senha. Verifique a senha atual.'; }
    finally { this.passwordSaving = false; }
  }

  get usernameFeedback(): string {
    if (this.usernameStatus === 'checking') {
      return 'Verificando disponibilidade...';
    }

    if (this.usernameStatus === 'available' && !this.getUsernameError()) {
      return 'Formato válido. A disponibilidade será verificada ao salvar.';
    }

    return 'Use letras, números, ponto ou underline, sem espaços.';
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

  private feedbackForSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]): string {
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
