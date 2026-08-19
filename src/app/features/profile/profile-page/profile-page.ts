import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AccountMockService, ProfileData } from '../../../core/services/account/account-mock.service';
import { PostService } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { AlertPopup } from '../../../shared/components/alert-popup/alert-popup';
import { ProfileForm } from '../../../shared/components/profile-form/profile-form';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';

@Component({
  selector: 'app-profile-page',
  imports: [SocialShell, ProfileForm, AlertPopup],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage {
  private readonly accountService = inject(AccountMockService);
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly user = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;
  profile: ProfileData = this.accountService.getProfile(this.user);
  editing = false;
  saving = false;
  showSuccess = false;

  save(): void {
    this.saving = true;
    this.profile = this.accountService.saveProfile(this.profile);
    this.saving = false;
    this.editing = false;
    this.showSuccess = true;
  }

  cancel(): void {
    this.profile = this.accountService.getProfile(this.user);
    this.editing = false;
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }
}
