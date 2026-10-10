import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notifications/notification.service';
import { PostService } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { NotificationItem } from '../../../shared/components/notification-item/notification-item';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';
@Component({
  selector: 'app-notifications-page',
  imports: [TranslatePipe, SocialShell, NotificationItem],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
})
export class NotificationsPage {
  readonly service = inject(NotificationService);
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  readonly user = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;
  readonly loading = this.service.loading;
  readonly notifications = this.service.notifications;
  markRead(id: string): void {
    this.service.markRead(id);
  }
  markAllRead(): void {
    this.service.markAllRead();
  }
  remove(id: string): void {
    this.service.remove(id);
  }
  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }
  trackNotification(_index: number, notification: { id: string }): string {
    return notification.id;
  }
}
