import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  imports: [TranslatePipe],
  selector: 'app-auth-mode-toggle',
  templateUrl: './auth-mode-toggle.html',
  styleUrl: './auth-mode-toggle.scss',
})
export class AuthModeToggle {
  @Input() registerStep = 1;
  @Output() goToLogin = new EventEmitter<void>();
  @Output() goToRegister = new EventEmitter<void>();
}
