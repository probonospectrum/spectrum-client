import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-auth-mode-toggle',
  templateUrl: './auth-mode-toggle.html',
  styleUrl: './auth-mode-toggle.scss',
})
export class AuthModeToggle {
  @Input() registerStep = 1;
  @Output() goToLogin = new EventEmitter<void>();
  @Output() goToRegister = new EventEmitter<void>();
}
