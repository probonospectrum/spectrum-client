import { LocalizedDatePipe, TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SpectrumNotification } from '../../../core/services/account/account-mock.service';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

@Component({
  imports: [LocalizedDatePipe, TranslatePipe],
  selector: 'app-notification-item',
  templateUrl: './notification-item.html',
  styleUrl: './notification-item.scss',
})
export class NotificationItem {
  private readonly router = inject(Router);
  @Input({ required: true }) notification!: SpectrumNotification & { postId?: string; createdAt?: string };
  @Output() markRead = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();

  get displayName(): string {
    return this.notification.actorName || this.notification.title;
  }

  get initials(): string {
    return this.displayName.charAt(0).toUpperCase();
  }

  onOpen(): void {
    if (!this.notification.read) {
      this.markRead.emit(this.notification.id);
    }
    if (this.notification.postId) void this.router.navigate(['/ocorrencias', this.notification.postId]);
  }

  onRemove(event: Event): void {
    event.stopPropagation();
    this.remove.emit(this.notification.id);
  }

  onKeyboard(event: Event): void {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    this.onOpen();
  }
}
