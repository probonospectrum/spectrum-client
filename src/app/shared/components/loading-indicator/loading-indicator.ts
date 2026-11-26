import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Component, Input } from '@angular/core';

@Component({
  imports: [TranslatePipe],
  selector: 'app-loading-indicator',
  templateUrl: './loading-indicator.html',
  styleUrl: './loading-indicator.scss',
})
export class LoadingIndicator {
  @Input() label = 'Carregando';
}
