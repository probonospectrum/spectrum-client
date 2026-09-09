import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MockLoadingService } from '../../../core/services/loading/mock-loading.service';
import {
  AccountMockService,
  SpectrumNotification,
} from '../../../core/services/account/account-mock.service';
import { PostService } from '../../../core/services/posts/post.service';
import { UserService } from '../../../core/services/user/user.service';
import { NotificationItem } from '../../../shared/components/notification-item/notification-item';
import { LoadingIndicator } from '../../../shared/components/loading-indicator/loading-indicator';
import { SocialShell } from '../../../shared/components/social-shell/social-shell';

@Component({
  selector: 'app-notifications-page',
  imports: [SocialShell, NotificationItem, LoadingIndicator],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
})
export class NotificationsPage implements OnInit {
  private readonly accountService = inject(AccountMockService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mockLoadingService = inject(MockLoadingService);
  private readonly postService = inject(PostService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly user = this.userService.getCurrentUser();
  readonly suggestions = this.postService.suggestions;
  loading = signal(true);
  notifications = signal<SpectrumNotification[]>([]);

  ngOnInit(): void {
    this.refresh();
  }

  get unreadCount(): number {
    return this.notifications().filter((notification) => !notification.read).length;
  }

  markRead(id: string): void {
    this.accountService.markNotificationAsRead(id);
    this.refresh();
  }

  markAllRead(): void {
    this.accountService.markAllNotificationsAsRead();
    this.refresh();
  }

  remove(id: string): void {
    this.accountService.removeNotification(id);
    this.refresh();
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigateByUrl('/login');
  }

  trackNotification(_index: number, notification: SpectrumNotification): string {
    return notification.id;
  }

  private refresh(): void {
    this.loading.set(true);
    this.mockLoadingService
      .load(() => this.accountService.getNotifications())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notifications) => {
        this.notifications.set(notifications);
        this.loading.set(false);
      });
  }
}
