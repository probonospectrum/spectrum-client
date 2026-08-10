import { Component, EventEmitter, Input, Output } from '@angular/core';

export type AlertPopupType = 'success' | 'error';

@Component({
  selector: 'app-alert-popup',
  templateUrl: './alert-popup.html',
  styleUrl: './alert-popup.scss',
})
export class AlertPopup {
  @Input() type: AlertPopupType = 'success';
  @Input() title = '';
  @Input() message = '';
  @Input() actionLabel = 'Ok';
  @Output() dismissed = new EventEmitter<void>();

  dismiss(): void {
    this.dismissed.emit();
  }
}
