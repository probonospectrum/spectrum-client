import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SpectrumNotification } from '../../../core/services/account/account-mock.service';

@Component({
  selector: 'app-notification-item',
  templateUrl: './notification-item.html',
  styleUrl: './notification-item.scss',
})
export class NotificationItem {
  @Input({ required: true }) notification!: SpectrumNotification;
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
  }

  onRemove(event: Event): void {
    event.stopPropagation();
    this.remove.emit(this.notification.id);
  }
}