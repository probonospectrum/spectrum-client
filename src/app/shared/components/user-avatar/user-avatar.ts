import { Component, Input, inject, signal } from '@angular/core';
import { AccountMockService } from '../../../core/services/account/account-mock.service';
import { LoggedUser, UserService } from '../../../core/services/user/user.service';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.html',
  styleUrl: './user-avatar.scss',
})
export class UserAvatar {
  private readonly userService = inject(UserService);
  private readonly accountService = inject(AccountMockService);
  @Input() user: LoggedUser | null = null;
  @Input() name = '';
  @Input() imageUrl = '';
  readonly failedUrl = signal('');

  get avatarUrl(): string {
    if (this.imageUrl) return this.imageUrl;
    const currentUser = this.userService.currentUser();
    const user = this.user && this.user._id === currentUser?._id ? currentUser : this.user;
    return this.accountService.getAvatarUrl(user);
  }

  get initial(): string {
    return (this.user?.name || this.name || 'Spectrum').trim().charAt(0).toUpperCase();
  }
}
