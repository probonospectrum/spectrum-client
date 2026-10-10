import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Component, Input } from '@angular/core';

@Component({
  imports: [TranslatePipe],
  selector: 'app-auth-shell',
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
})
export class AuthShell {
  @Input() compact = false;
}
