import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Component, Input } from '@angular/core';
import { LoadingIndicator } from '../loading-indicator/loading-indicator';

@Component({
  selector: 'app-button',
  imports: [TranslatePipe, LoadingIndicator],
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class Button {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() loadingLabel = 'Carregando';
}
