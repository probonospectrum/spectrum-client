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

  get typeLabel(): string {
    const labels: Record<SpectrumNotification['type'], string> = {
      system: 'Sistema',
      movement: 'Movimento',
      alert: 'Alerta',
      message: 'Mensagem',
      confirmation: 'Confirmado',
    };

    return labels[this.notification.type];
  }
}
