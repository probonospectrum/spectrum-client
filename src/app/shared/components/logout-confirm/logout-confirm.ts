import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  imports: [TranslatePipe],
  selector: 'app-logout-confirm',
  templateUrl: './logout-confirm.html',
  styleUrl: './logout-confirm.scss',
})
export class LogoutConfirm {
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
