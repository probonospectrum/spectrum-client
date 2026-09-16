import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountMockService, SettingsData } from '../../../core/services/account/account-mock.service';
import { PostService } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { AlertPopup } from '../../../shared/components/alert-popup/alert-popup';
import { SettingsSection } from '../../../shared/components/settings-section/settings-section';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';
import { ToggleSwitch } from '../../../shared/components/toggle-switch/toggle-switch';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, SocialShell, SettingsSection, ToggleSwitch, AlertPopup],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  private readonly accountService = inject(AccountMockService);
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly user = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;
  settings: SettingsData = this.accountService.getSettings();
  currentPassword = '';
  newPassword = '';
  showSuccess = false;

  save(): void {
    this.settings = this.accountService.saveSettings(this.settings);
    this.currentPassword = '';
    this.newPassword = '';
    this.showSuccess = true;
  }

  setSetting<K extends keyof SettingsData>(key: K, value: SettingsData[K]): void {
    this.settings = { ...this.settings, [key]: value };
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }
}
